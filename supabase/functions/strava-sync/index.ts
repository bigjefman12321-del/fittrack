import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function refreshStravaToken(refreshToken: string) {
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: Deno.env.get("STRAVA_CLIENT_ID"),
      client_secret: Deno.env.get("STRAVA_CLIENT_SECRET"),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { data: tokens } = await supabase
      .from("integration_tokens")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!tokens?.strava_refresh_token) {
      return new Response(JSON.stringify({ error: "Strava not connected" }), { status: 400 });
    }

    let accessToken = tokens.strava_access_token;
    if (tokens.strava_expires_at && tokens.strava_expires_at * 1000 < Date.now()) {
      const refreshed = await refreshStravaToken(tokens.strava_refresh_token);
      accessToken = refreshed.access_token;
      await supabase.from("integration_tokens").update({
        strava_access_token: refreshed.access_token,
        strava_refresh_token: refreshed.refresh_token,
        strava_expires_at: refreshed.expires_at,
      }).eq("user_id", user.id);
    }

    const after = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;
    const activitiesRes = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=50`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const activities = await activitiesRes.json();
    let synced = 0;

    if (Array.isArray(activities)) {
      for (const act of activities) {
        if (act.type !== "Run") continue;
        const { error } = await supabase.from("runs").upsert({
          user_id: user.id,
          strava_id: act.id,
          date: act.start_date_local?.split("T")[0],
          distance_m: act.distance,
          duration_s: act.moving_time,
          pace_s_per_km: act.distance > 0 ? act.moving_time / (act.distance / 1000) : 0,
          elevation_m: act.total_elevation_gain,
          avg_hr: act.average_heartrate ?? null,
          polyline: act.map?.summary_polyline ?? null,
          source: "strava",
          name: act.name,
        }, { onConflict: "strava_id" });
        if (!error) synced++;
      }
    }

    return new Response(JSON.stringify({ synced }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
