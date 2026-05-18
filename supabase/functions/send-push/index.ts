// Supabase Edge Function: send-push
// Triggered via Database Webhook on INSERT to orders table
// Sends Web Push notifications to all subscribed admin devices

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// VAPID keys (set as Supabase secrets)
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const VAPID_SUBJECT = "mailto:isabellyfr2000@gmail.com";

// Helper: base64url encode
function base64urlEncode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Helper: base64url decode
function base64urlDecode(str: string): Uint8Array {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

// Create VAPID JWT for authorization
async function createVapidJWT(audience: string): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 3600,
    sub: VAPID_SUBJECT,
  };

  const encodedHeader = base64urlEncode(
    new TextEncoder().encode(JSON.stringify(header))
  );
  const encodedPayload = base64urlEncode(
    new TextEncoder().encode(JSON.stringify(payload))
  );
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const privateKeyBytes = base64urlDecode(VAPID_PRIVATE_KEY);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    privateKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  const encodedSig = base64urlEncode(new Uint8Array(signature));
  return `${signingInput}.${encodedSig}`;
}

// Send a single push notification to one subscription
async function sendPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string
): Promise<boolean> {
  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const jwt = await createVapidJWT(audience);

  const payloadBytes = new TextEncoder().encode(payload);

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Authorization": `vapid t=${jwt},k=${VAPID_PUBLIC_KEY}`,
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      "TTL": "86400",
    },
    body: payloadBytes,
  });

  return response.ok || response.status === 201;
}

serve(async (req) => {
  // Allow CORS
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Body can come from DB Webhook (record) or direct call ({ order })
    const order = body.record ?? body.order ?? body;

    if (!order) {
      return new Response(JSON.stringify({ error: "No order data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build notification payload
    let itemCount = 0;
    let itemsText = "";
    try {
      const items = Array.isArray(order.items)
        ? order.items
        : JSON.parse(order.items ?? "[]");
      itemCount = items.reduce((acc: number, i: any) => acc + (i.quantity ?? 1), 0);
      itemsText = items
        .map((i: any) => `${i.quantity}x ${i.category}`)
        .join(", ");
    } catch (_) {}

    const totalFormatted = order.total
      ? Number(order.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "—";

    const orderId = order.id?.slice(0, 8).toUpperCase() ?? "?";
    const customerName = order.customer_name ?? "Cliente";

    const notifPayload = JSON.stringify({
      title: `🍪 Novo Pedido #${orderId}`,
      body: `${customerName} · ${itemCount} ${itemCount === 1 ? "item" : "itens"} · ${totalFormatted}${itemsText ? `\n${itemsText}` : ""}`,
      orderId: order.id ?? "",
      total: totalFormatted,
      itemCount,
    });

    // Get all subscriptions from DB
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (error) {
      console.error("Error fetching subscriptions:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No subscriptions" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send to all subscriptions, remove expired ones
    let sent = 0;
    const toRemove: string[] = [];

    for (const sub of subscriptions) {
      try {
        const success = await sendPushNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          notifPayload
        );
        if (success) {
          sent++;
        } else {
          toRemove.push(sub.id);
        }
      } catch (e) {
        console.error("Push failed for", sub.endpoint, e);
        toRemove.push(sub.id);
      }
    }

    // Clean up expired subscriptions
    if (toRemove.length > 0) {
      await supabase.from("push_subscriptions").delete().in("id", toRemove);
    }

    return new Response(JSON.stringify({ sent, removed: toRemove.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
