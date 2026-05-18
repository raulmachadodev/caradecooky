// Supabase Edge Function: send-push
// Triggered via Database Webhook on INSERT to orders table
// RFC 8030 compliant — sends push with proper VAPID JWT + encrypted payload (RFC 8291)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const VAPID_SUBJECT = "mailto:isabellyfr2000@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// --- Helpers ---
function b64uEncode(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64uDecode(s: string): Uint8Array {
  const b = s.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b), (c) => c.charCodeAt(0));
}
function concat(...arrs: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(arrs.reduce((n, a) => n + a.length, 0));
  let i = 0; for (const a of arrs) { out.set(a, i); i += a.length; }
  return out;
}

// Build PKCS8 wrapper for raw P-256 private key (32 bytes)
function rawToPkcs8(raw: Uint8Array): Uint8Array {
  // DER prefix for P-256 private key in PKCS8 format
  const prefix = new Uint8Array([
    0x30, 0x41, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07,
    0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x08,
    0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, 0x04,
    0x27, 0x30, 0x25, 0x02, 0x01, 0x01, 0x04, 0x20,
  ]);
  return concat(prefix, raw);
}

// HKDF-Expand (SHA-256)
async function hkdfExpand(prk: Uint8Array, info: Uint8Array, len: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const out = new Uint8Array(len);
  let prev = new Uint8Array(0);
  for (let i = 0; i < Math.ceil(len / 32); i++) {
    const data = concat(prev, info, new Uint8Array([i + 1]));
    prev = new Uint8Array(await crypto.subtle.sign("HMAC", key, data));
    out.set(prev.subarray(0, Math.min(32, len - i * 32)), i * 32);
  }
  return out;
}

// HKDF-Extract (SHA-256)
async function hkdfExtract(salt: Uint8Array, ikm: Uint8Array): Promise<Uint8Array> {
  const saltKey = await crypto.subtle.importKey("raw", salt, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", saltKey, ikm));
}

// RFC 8291 payload encryption (aes128gcm)
async function encryptPayload(
  p256dh: string,
  auth: string,
  plaintext: string,
): Promise<{ body: Uint8Array }> {
  const receiverPubBytes = b64uDecode(p256dh);
  const authBytes = b64uDecode(auth);
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Ephemeral sender key pair
  const senderPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"],
  );
  const senderPubBytes = new Uint8Array(
    await crypto.subtle.exportKey("raw", senderPair.publicKey),
  );

  // Import receiver public key
  const receiverPub = await crypto.subtle.importKey(
    "raw", receiverPubBytes, { name: "ECDH", namedCurve: "P-256" }, false, [],
  );

  // ECDH shared secret
  const ecdhBits = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: receiverPub }, senderPair.privateKey, 256),
  );

  // PRK from auth (RFC 8291 §3.4)
  const prkInfo = concat(
    new TextEncoder().encode("WebPush: info\x00"),
    receiverPubBytes,
    senderPubBytes,
  );
  const prk1 = await hkdfExtract(authBytes, ecdhBits);
  const ikm = await hkdfExpand(prk1, prkInfo, 32);

  // CEK and nonce (RFC 8188)
  const prk2 = await hkdfExtract(salt, ikm);
  const cek = await hkdfExpand(prk2, new TextEncoder().encode("Content-Encoding: aes128gcm\x00\x01"), 16);
  const nonce = await hkdfExpand(prk2, new TextEncoder().encode("Content-Encoding: nonce\x00\x01"), 12);

  // AES-128-GCM encrypt (add 0x02 delimiter per RFC 8188)
  const aesKey = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const padded = concat(new TextEncoder().encode(plaintext), new Uint8Array([0x02]));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, padded),
  );

  // RFC 8188 header: salt(16) + rs(4, BE) + idlen(1) + senderPub(65) + ciphertext
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096, false);
  const body = concat(salt, rs, new Uint8Array([senderPubBytes.length]), senderPubBytes, ciphertext);
  return { body };
}

// VAPID JWT (RFC 8292) — uses PKCS8 import to fix the raw key issue
async function createVapidJWT(audience: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64uEncode(new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const body = b64uEncode(new TextEncoder().encode(JSON.stringify({
    aud: audience, exp: now + 43200, sub: VAPID_SUBJECT,
  })));
  const input = `${header}.${body}`;

  const privKey = await crypto.subtle.importKey(
    "pkcs8",
    rawToPkcs8(b64uDecode(VAPID_PRIVATE_KEY)),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, privKey, new TextEncoder().encode(input)),
  );
  return `${input}.${b64uEncode(sig)}`;
}

// Send push to one endpoint
async function sendPush(sub: { endpoint: string; p256dh: string; auth: string }, payload: string): Promise<number> {
  const url = new URL(sub.endpoint);
  const jwt = await createVapidJWT(`${url.protocol}//${url.host}`);
  const { body } = await encryptPayload(sub.p256dh, sub.auth, payload);

  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      "Authorization": `vapid t=${jwt},k=${VAPID_PUBLIC_KEY}`,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      "TTL": "86400",
      "Urgency": "high",
    },
    body,
  });
  return res.status;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const order = body.record ?? body.order ?? body;

    // Build notification text
    let itemCount = 0;
    try {
      const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items ?? "[]");
      itemCount = items.reduce((s: number, i: any) => s + (i.quantity ?? 1), 0);
    } catch (_) {}

    const total = order.total
      ? Number(order.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "—";
    const orderId = (order.id ?? "").slice(0, 8).toUpperCase();
    const name = order.customer_name ?? "Cliente";

    const payload = JSON.stringify({
      title: `🍪 Novo Pedido #${orderId}`,
      body: `${name} · ${itemCount} ${itemCount === 1 ? "item" : "itens"} · ${total}`,
      orderId: order.id ?? "",
    });

    // Fetch subscriptions
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const { data: subs, error } = await supabase.from("push_subscriptions").select("*");
    if (error) throw error;
    if (!subs?.length) {
      return new Response(JSON.stringify({ sent: 0, message: "no subscriptions" }), { headers: corsHeaders });
    }

    let sent = 0;
    const toRemove: string[] = [];
    for (const sub of subs) {
      try {
        const status = await sendPush(sub, payload);
        if (status === 201 || status === 200 || status === 204) sent++;
        else if (status === 404 || status === 410) toRemove.push(sub.id);
        else console.warn("push status", status, "for", sub.endpoint);
      } catch (e) {
        console.error("push error:", e);
      }
    }

    if (toRemove.length) {
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
