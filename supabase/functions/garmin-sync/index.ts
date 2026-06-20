import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Sync Garmin health data scaffold.
 * Pulls sleep, HRV, VO2 Max, resting HR, steps, stress, body battery.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

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

    if (!tokens?.garmin_access_token) {
      return new Response(JSON.stringify({ error: "Garmin not connected" }), { status: 400 });
    }

    // Placeholder: actual Garmin Health API endpoints vary by approved scope
    // Example endpoints (require Health API approval):
    // - /wellness-api/rest/sleeps
    // - /wellness-api/rest/dailies
    // - /wellness-api/rest/hrv
    let synced = 0;

    // Scaffold response — implement per Garmin API docs once approved
    return new Response(JSON.stringify({
      synced,
      message: "Garmin sync scaffold ready. Configure Health API endpoints after approval.",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
