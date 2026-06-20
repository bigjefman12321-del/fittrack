import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { code, redirect_uri } = await req.json();
    const clientId = Deno.env.get("STRAVA_CLIENT_ID") ?? Deno.env.get("VITE_STRAVA_CLIENT_ID");
    const clientSecret = Deno.env.get("STRAVA_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ error: "Strava credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tokenRes = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri,
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok) {
      return new Response(JSON.stringify({ error: tokens }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("integration_tokens").upsert({
      user_id: user.id,
      strava_access_token: tokens.access_token,
      strava_refresh_token: tokens.refresh_token,
      strava_expires_at: tokens.expires_at,
      updated_at: new Date().toISOString(),
    });

    await supabase.from("users").update({ strava_connected: true }).eq("id", user.id);

    // Sync last 90 days of runs
    const after = Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60;
    const activitiesRes = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=200`,
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
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

    return new Response(JSON.stringify({ success: true, synced }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
