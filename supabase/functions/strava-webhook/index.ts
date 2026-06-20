import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * Strava webhook listener scaffold.
 * Register webhook at POST https://www.strava.com/api/v3/push_subscriptions
 * with callback URL: https://YOUR_PROJECT.supabase.co/functions/v1/strava-webhook
 *
 * Set STRAVA_WEBHOOK_VERIFY_TOKEN secret for subscription verification.
 */
const VERIFY_TOKEN = Deno.env.get("STRAVA_WEBHOOK_VERIFY_TOKEN") ?? "fittrack";

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // Subscription validation (GET)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return new Response(JSON.stringify({ "hub.challenge": challenge }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // Activity events (POST) — trigger sync for affected users
  if (req.method === "POST") {
    const body = await req.json();
    console.log("Strava webhook event:", body);
    // TODO: Look up user by owner_id, invoke strava-sync
    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Method not allowed", { status: 405 });
});
