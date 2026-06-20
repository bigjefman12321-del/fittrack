import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Garmin Health API token exchange scaffold.
 * Full implementation requires approved Garmin Health API access.
 * See README for registration at https://developer.garmin.com/
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { code } = await req.json();
    const clientId = Deno.env.get("GARMIN_CLIENT_ID");
    const clientSecret = Deno.env.get("GARMIN_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({
        error: "Garmin credentials not configured. Apply for Garmin Health API access and set secrets.",
      }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // Placeholder token exchange — replace with actual Garmin OAuth2 flow once approved
    const tokenRes = await fetch("https://connectapi.garmin.com/oauth-service/oauth/exchange/user/2.0", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();

    if (!tokenRes.ok) {
      return new Response(JSON.stringify({
        error: "Garmin token exchange failed. Ensure Health API access is approved.",
        details: tokens,
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await supabase.from("integration_tokens").upsert({
      user_id: user.id,
      garmin_access_token: tokens.access_token,
      garmin_refresh_token: tokens.refresh_token,
      updated_at: new Date().toISOString(),
    });

    await supabase.from("users").update({ garmin_connected: true }).eq("id", user.id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
