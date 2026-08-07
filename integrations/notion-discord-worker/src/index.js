const NOTION_API_VERSION = "2026-03-11";
const DISCORD_USERNAME = "KLEIO Updates";

const SUPPORTED_EVENTS = new Set([
  "page.content_updated",
  "page.properties_updated",
  "page.created",
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return jsonResponse({
        ok: true,
        service: "kleio-notion-discord",
        configured: {
          notionApi: Boolean(env.NOTION_API_TOKEN),
          notionSignature: Boolean(env.NOTION_VERIFICATION_TOKEN),
          discord: Boolean(env.DISCORD_WEBHOOK_URL),
        },
      });
    }

    if (url.pathname !== "/webhooks/notion") {
      return new Response("Not found", { status: 404 });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: { Allow: "POST" },
      });
    }

    const rawBody = await request.arrayBuffer();
    const rawText = new TextDecoder().decode(rawBody);

    let payload;
    try {
      payload = JSON.parse(rawText);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    // Notion sends this one-time payload when a webhook subscription is created.
    // The token is intentionally only written to protected Worker logs so it can
    // be copied into the NOTION_VERIFICATION_TOKEN secret after verification.
    if (typeof payload?.verification_token === "string") {
      console.log(
        JSON.stringify({
          event: "notion_webhook_verification",
          verification_token: payload.verification_token,
        }),
      );
      return jsonResponse({ ok: true, verificationReceived: true });
    }

    if (!env.NOTION_VERIFICATION_TOKEN) {
      console.error(
        JSON.stringify({
          event: "notion_webhook_rejected",
          reason: "NOTION_VERIFICATION_TOKEN is not configured",
        }),
      );
      return new Response("Webhook verification is not configured", {
        status: 503,
      });
    }

    const signature = request.headers.get("x-notion-signature");
    const trusted = await verifyNotionSignature(
      rawBody,
      signature,
      env.NOTION_VERIFICATION_TOKEN,
    );

    if (!trusted) {
      console.warn(
        JSON.stringify({
          event: "notion_webhook_rejected",
          reason: "invalid signature",
        }),
      );
      return new Response("Invalid signature", { status: 401 });
    }

    if (!SUPPORTED_EVENTS.has(payload?.type)) {
      return jsonResponse({ ok: true, ignored: true });
    }

    if (payload?.entity?.type !== "page" || !payload?.entity?.id) {
      return jsonResponse({ ok: true, ignored: true });
    }

    if (!env.NOTION_API_TOKEN || !env.DISCORD_WEBHOOK_URL) {
      console.error(
        JSON.stringify({
          event: "notion_webhook_failed",
          reason: "required runtime secret missing",
        }),
      );
      return new Response("Integration is not fully configured", {
        status: 503,
      });
    }

    try {
      const update = await buildUpdate(payload, env);
      await postToDiscord(update, payload, env.DISCORD_WEBHOOK_URL);

      console.log(
        JSON.stringify({
          event: "notion_update_forwarded",
          notionEventId: payload.id,
          notionEventType: payload.type,
          pageId: payload.entity.id,
          pageTitle: update.title,
        }),
      );

      return jsonResponse({ ok: true });
    } catch (error) {
      console.error(
        JSON.stringify({
          event: "notion_update_failed",
          notionEventId: payload?.id ?? null,
          notionEventType: payload?.type ?? null,
          message: error instanceof Error ? error.message : String(error),
        }),
      );

      // Returning 500 allows Notion to retry a delivery that failed before the
      // Discord message was successfully posted.
      return new Response("Unable to process webhook", { status: 500 });
    }
  },
};

async function buildUpdate(payload, env) {
  const pageId = payload.entity.id;
  const page = await notionGet(`/v1/pages/${pageId}`, env.NOTION_API_TOKEN);
  const title = extractPageTitle(page);
  const pageUrl = page.url || `https://www.notion.so/${pageId.replaceAll("-", "")}`;

  let lines = [];

  if (payload.type === "page.content_updated") {
    const updatedBlocks = Array.isArray(payload?.data?.updated_blocks)
      ? payload.data.updated_blocks
      : [];

    lines = await summarizeUpdatedBlocks(
      updatedBlocks.slice(0, 4),
      env.NOTION_API_TOKEN,
    );

    if (updatedBlocks.length > 4) {
      lines.push(`+ ${updatedBlocks.length - 4} additional changed block(s)`);
    }

    if (lines.length === 0) {
      lines.push("Page content was updated.");
    }
  }

  if (payload.type === "page.properties_updated") {
    const updatedPropertyIds = Array.isArray(payload?.data?.updated_properties)
      ? payload.data.updated_properties
      : [];

    lines = summarizeUpdatedProperties(page, updatedPropertyIds);

    if (lines.length === 0) {
      lines.push("Page details were updated.");
    }
  }

  if (payload.type === "page.created") {
    lines = ["A new Notion page was created."];
  }

  return {
    title,
    pageUrl,
    lines,
  };
}

async function summarizeUpdatedBlocks(updatedBlocks, notionToken) {
  const summaries = [];

  // Keep requests sequential and capped. Notion already aggregates rapid edits,
  // and a small cap keeps us comfortably below API pressure for normal updates.
  for (const item of updatedBlocks) {
    if (!item?.id) continue;

    try {
      const block = await notionGet(`/v1/blocks/${item.id}`, notionToken);
      const text = extractBlockText(block);

      if (text) {
        summaries.push(text);
      } else {
        summaries.push(`${humanizeBlockType(block?.type)} changed.`);
      }
    } catch (error) {
      // A removed block may no longer be retrievable by the time the aggregated
      // webhook is delivered. Treat that as a valid content change, not a fatal
      // integration error.
      if (error instanceof NotionHttpError && error.status === 404) {
        summaries.push("A block was removed or is no longer accessible.");
        continue;
      }
      throw error;
    }
  }

  return unique(summaries).map((line) => truncate(line, 220));
}

function summarizeUpdatedProperties(page, updatedPropertyIds) {
  const properties = Object.entries(page?.properties ?? {});
  const idSet = new Set(updatedPropertyIds);
  const lines = [];

  for (const [name, property] of properties) {
    if (!idSet.has(property?.id)) continue;

    const value = formatPropertyValue(property);
    lines.push(value ? `${name}: ${value}` : `${name} was updated.`);
  }

  return lines.slice(0, 5).map((line) => truncate(line, 220));
}

function formatPropertyValue(property) {
  if (!property || typeof property !== "object") return "";

  switch (property.type) {
    case "title":
      return richTextToPlain(property.title);
    case "rich_text":
      return richTextToPlain(property.rich_text);
    case "select":
      return property.select?.name ?? "";
    case "status":
      return property.status?.name ?? "";
    case "multi_select":
      return (property.multi_select ?? []).map((item) => item.name).join(", ");
    case "checkbox":
      return property.checkbox ? "Yes" : "No";
    case "number":
      return property.number == null ? "" : String(property.number);
    case "url":
      return property.url ?? "";
    case "email":
      return property.email ?? "";
    case "phone_number":
      return property.phone_number ?? "";
    case "date": {
      const start = property.date?.start;
      const end = property.date?.end;
      if (!start) return "";
      return end ? `${start} → ${end}` : start;
    }
    case "people":
      return (property.people ?? [])
        .map((person) => person.name)
        .filter(Boolean)
        .join(", ");
    case "files":
      return (property.files ?? [])
        .map((file) => file.name)
        .filter(Boolean)
        .join(", ");
    case "relation":
      return `${property.relation?.length ?? 0} linked item(s)`;
    default:
      return "";
  }
}

function extractPageTitle(page) {
  for (const property of Object.values(page?.properties ?? {})) {
    if (property?.type === "title") {
      const value = richTextToPlain(property.title);
      if (value) return value;
    }
  }
  return "Untitled Notion page";
}

function extractBlockText(block) {
  const type = block?.type;
  if (!type) return "";

  const value = block[type];
  if (!value || typeof value !== "object") return "";

  if (type === "child_page" || type === "child_database") {
    return value.title ? `${value.title}` : "";
  }

  if (type === "bookmark" || type === "link_preview") {
    return value.url ? `${humanizeBlockType(type)}: ${value.url}` : "";
  }

  const text = richTextToPlain(value.rich_text);
  if (!text) return "";

  if (type === "to_do") {
    return `${value.checked ? "Completed" : "To-do"}: ${text}`;
  }

  if (type.startsWith("heading_")) {
    return `Heading: ${text}`;
  }

  if (type === "quote") {
    return `Quote: ${text}`;
  }

  if (type === "callout") {
    return `Callout: ${text}`;
  }

  return text;
}

function richTextToPlain(items) {
  if (!Array.isArray(items)) return "";
  return items
    .map((item) => item?.plain_text ?? item?.text?.content ?? "")
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

async function postToDiscord(update, payload, webhookUrl) {
  const changed = update.lines.map((line) => `• ${escapeDiscordText(line)}`).join("\n");
  const eventLabel = eventTypeLabel(payload.type);

  const body = {
    username: DISCORD_USERNAME,
    allowed_mentions: { parse: [] },
    embeds: [
      {
        title: update.title,
        url: update.pageUrl,
        description: truncate(changed || "• Notion page updated.", 3500),
        fields: [
          {
            name: "Update",
            value: eventLabel,
            inline: true,
          },
          {
            name: "Workspace",
            value: truncate(payload.workspace_name || "KLEIO", 120),
            inline: true,
          },
          {
            name: "Open in Notion",
            value: `[View the updated page](${update.pageUrl})`,
            inline: false,
          },
        ],
        footer: {
          text: "KLEIO • Notion activity",
        },
        timestamp: payload.timestamp,
      },
    ],
  };

  const response = await fetch(`${webhookUrl}${webhookUrl.includes("?") ? "&" : "?"}wait=true`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Discord webhook failed (${response.status}): ${truncate(detail, 300)}`,
    );
  }
}

async function notionGet(path, token, attempt = 0) {
  const response = await fetch(`https://api.notion.com${path}`, {
    headers: {
      authorization: `Bearer ${token}`,
      "notion-version": NOTION_API_VERSION,
      accept: "application/json",
    },
  });

  if (response.status === 429 && attempt < 2) {
    const retryAfter = Number(response.headers.get("retry-after") || "1");
    await sleep(Math.max(1, retryAfter) * 1000);
    return notionGet(path, token, attempt + 1);
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new NotionHttpError(
      response.status,
      `Notion API failed (${response.status}): ${truncate(detail, 300)}`,
    );
  }

  return response.json();
}

async function verifyNotionSignature(rawBody, signature, verificationToken) {
  if (!signature?.startsWith("sha256=")) return false;

  const supplied = signature.slice("sha256=".length);
  if (!/^[a-f0-9]{64}$/i.test(supplied)) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(verificationToken),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  return crypto.subtle.verify(
    "HMAC",
    key,
    hexToBytes(supplied),
    rawBody,
  );
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < hex.length; index += 2) {
    bytes[index / 2] = Number.parseInt(hex.slice(index, index + 2), 16);
  }
  return bytes;
}

function eventTypeLabel(type) {
  switch (type) {
    case "page.content_updated":
      return "Content updated";
    case "page.properties_updated":
      return "Page details updated";
    case "page.created":
      return "New page created";
    default:
      return "Notion updated";
  }
}

function humanizeBlockType(type) {
  if (!type) return "Content";
  return type
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function escapeDiscordText(value) {
  return String(value)
    .replaceAll("@everyone", "@ everyone")
    .replaceAll("@here", "@ here")
    .replace(/<@([!&]?\d+)>/g, "@ user");
}

function truncate(value, limit) {
  const text = String(value ?? "");
  if (text.length <= limit) return text;
  return `${text.slice(0, Math.max(0, limit - 1))}…`;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers ?? {}),
    },
  });
}

class NotionHttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "NotionHttpError";
    this.status = status;
  }
}
