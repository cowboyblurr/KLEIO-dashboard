import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const MAX_BODY_BYTES = 64_000;
const RELAY_SECRET_HEADER = "x-kleio-relay-secret";

const CATEGORY_COLORS: Record<string, number> = {
  meeting: 0x7c3aed,
  product: 0x2563eb,
  strategy: 0xca8a04,
  operations: 0x6b7280,
  outreach: 0x16a34a,
  governance: 0xdc2626,
};

const ALLOWED_DISCORD_HOSTS = new Set([
  "discord.com",
  "canary.discord.com",
  "ptb.discord.com",
  "discordapp.com",
]);

type JsonObject = Record<string, unknown>;

function jsonResponse(body: JsonObject, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function inspectDiscordConfiguration(value: string): {
  configured: boolean;
  valid: boolean;
} {
  if (!value) return { configured: false, valid: false };

  try {
    const url = new URL(value);
    const valid =
      url.protocol === "https:" &&
      ALLOWED_DISCORD_HOSTS.has(url.hostname) &&
      url.pathname.startsWith("/api/webhooks/");
    return { configured: true, valid };
  } catch {
    return { configured: true, valid: false };
  }
}

async function constantTimeEqual(left: string, right: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);

  const leftBytes = new Uint8Array(leftHash);
  const rightBytes = new Uint8Array(rightHash);
  let mismatch = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < leftBytes.length; index += 1) {
    mismatch |= leftBytes[index] ^ rightBytes[index];
  }

  return mismatch === 0;
}

function findKey(input: unknown, targetKey: string, depth = 0): unknown {
  if (depth > 6 || input === null || typeof input !== "object") return undefined;

  if (Array.isArray(input)) {
    for (const item of input) {
      const match = findKey(item, targetKey, depth + 1);
      if (match !== undefined) return match;
    }
    return undefined;
  }

  const record = input as JsonObject;
  const normalizedTarget = targetKey.toLowerCase();

  for (const [key, value] of Object.entries(record)) {
    if (key.toLowerCase() === normalizedTarget) return value;
  }

  for (const value of Object.values(record)) {
    const match = findKey(value, targetKey, depth + 1);
    if (match !== undefined) return match;
  }

  return undefined;
}

function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(normalizeValue).filter(Boolean).join(", ");
  if (typeof value !== "object") return "";

  const record = value as JsonObject;
  if (typeof record.plain_text === "string") return record.plain_text.trim();
  if (typeof record.content === "string") return record.content.trim();
  if (typeof record.name === "string") return record.name.trim();
  if (typeof record.url === "string") return record.url.trim();
  if (typeof record.start === "string") return record.start.trim();
  if (Array.isArray(record.title)) return normalizeValue(record.title);
  if (Array.isArray(record.rich_text)) return normalizeValue(record.rich_text);
  if (Array.isArray(record.people)) return normalizeValue(record.people);
  if (record.select && typeof record.select === "object") return normalizeValue(record.select);
  if (record.date && typeof record.date === "object") return normalizeValue(record.date);
  if (record.formula && typeof record.formula === "object") {
    const formula = record.formula as JsonObject;
    for (const candidate of ["string", "number", "boolean", "date"]) {
      if (formula[candidate] !== undefined) return normalizeValue(formula[candidate]);
    }
  }
  if (record.value !== undefined) return normalizeValue(record.value);
  return "";
}

function firstText(payload: unknown, keys: string[]): string {
  for (const key of keys) {
    const value = normalizeValue(findKey(payload, key));
    if (value) return value;
  }
  return "";
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function safeHttpUrl(value: string): string | undefined {
  if (!value) return undefined;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
}

Deno.serve(async (request: Request) => {
  const discordWebhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL")?.trim() ?? "";
  const expectedRelaySecret = Deno.env.get("NOTION_RELAY_SECRET")?.trim() ?? "";
  const discordConfiguration = inspectDiscordConfiguration(discordWebhookUrl);

  if (request.method === "GET" || request.method === "HEAD") {
    return jsonResponse({
      ok: discordConfiguration.valid && Boolean(expectedRelaySecret),
      service: "kleio-notion-discord-relay",
      configuration: {
        discordWebhookConfigured: discordConfiguration.configured,
        discordWebhookValid: discordConfiguration.valid,
        relaySecretConfigured: Boolean(expectedRelaySecret),
      },
    }, discordConfiguration.valid && expectedRelaySecret ? 200 : 503);
  }

  if (request.method !== "POST") {
    return jsonResponse({ ok: false, error: "method_not_allowed" }, 405);
  }

  if (!discordWebhookUrl) {
    console.error("DISCORD_WEBHOOK_URL is not configured.");
    return jsonResponse({ ok: false, error: "discord_secret_missing" }, 424);
  }

  if (!discordConfiguration.valid) {
    console.error("DISCORD_WEBHOOK_URL is invalid.");
    return jsonResponse({ ok: false, error: "invalid_discord_configuration" }, 422);
  }

  if (!expectedRelaySecret) {
    console.error("NOTION_RELAY_SECRET is not configured.");
    return jsonResponse({ ok: false, error: "relay_secret_missing" }, 428);
  }

  const suppliedRelaySecret = request.headers.get(RELAY_SECRET_HEADER)?.trim() ?? "";
  if (!suppliedRelaySecret || !(await constantTimeEqual(suppliedRelaySecret, expectedRelaySecret))) {
    return jsonResponse({ ok: false, error: "unauthorized" }, 401);
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_BODY_BYTES) return jsonResponse({ ok: false, error: "payload_too_large" }, 413);

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return jsonResponse({ ok: false, error: "payload_too_large" }, 413);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ ok: false, error: "invalid_json" }, 400);
  }

  const update = firstText(payload, ["Update", "Title", "Name"]);
  const summary = firstText(payload, ["Summary", "Description"]);
  const category = firstText(payload, ["Category"]);
  const link = safeHttpUrl(firstText(payload, ["Link", "Page URL", "URL"]));
  const updated = firstText(payload, ["Updated", "Last Edited", "Date"]);
  const updatedBy = firstText(payload, ["Updated By", "Edited By", "Author"]);

  const title = truncate(update || "KLEIO project update", 256);
  const description = truncate(summary || "A tracked update was added to the KLEIO Notion workspace.", 4_000);
  const color = CATEGORY_COLORS[category.toLowerCase()] ?? 0x7c3aed;

  const fields = [
    category ? { name: "Category", value: truncate(category, 1_024), inline: true } : null,
    updated ? { name: "Updated", value: truncate(updated, 1_024), inline: true } : null,
    updatedBy ? { name: "Updated by", value: truncate(updatedBy, 1_024), inline: true } : null,
  ].filter(Boolean);

  const discordPayload: JsonObject = {
    username: "KLEIO Update Relay",
    allowed_mentions: { parse: [] },
    embeds: [{
      title,
      description,
      url: link,
      color,
      fields,
      footer: { text: "KLEIO • Notion Latest Updates" },
      timestamp: new Date().toISOString(),
    }],
  };

  const discordUrl = new URL(discordWebhookUrl);
  discordUrl.searchParams.set("wait", "true");

  const discordResponse = await fetch(discordUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(discordPayload),
  });

  if (!discordResponse.ok) {
    const responseText = truncate(await discordResponse.text(), 500);
    console.error("Discord webhook delivery failed.", { status: discordResponse.status, response: responseText });
    return jsonResponse({ ok: false, error: "discord_delivery_failed", status: discordResponse.status }, 502);
  }

  return jsonResponse({ ok: true, relayed: { title, category: category || null, linked: Boolean(link) } });
});
