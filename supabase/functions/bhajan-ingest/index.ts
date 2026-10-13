import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json"
};
const MAX_AUDIO_BYTES = 24 * 1024 * 1024;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Cache-Control": "no-store" }
  });
}
function bearer(req: Request) {
  const h = req.headers.get("Authorization") || "";
  return h.startsWith("Bearer ") ? h.slice(7) : "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const jwt = bearer(req);
  if (!jwt) return json({ error: "Authentication required" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${jwt}` } } }
  );
  const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
  if (userError || !user) return json({ error: "Invalid or expired session" }, 401);

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return json({ error: "Voice transcription is not configured" }, 503);

  let form: FormData;
  try { form = await req.formData(); }
  catch { return json({ error: "Expected multipart form data" }, 400); }

  const file = form.get("file");
  if (!(file instanceof File)) return json({ error: "Audio file is required" }, 400);
  if (!file.type.startsWith("audio/")) return json({ error: "Unsupported file type" }, 415);
  if (file.size > MAX_AUDIO_BYTES) return json({ error: "Audio file is too large" }, 413);

  const fd = new FormData();
  fd.append("file", file, file.name || "bhajan-audio");
  fd.append("model", Deno.env.get("OPENAI_TRANSCRIBE_MODEL") || "gpt-transcribe");
  fd.append("language", "hi");
  fd.append("prompt", "This is a Hindu devotional kirtan or bhajan in Hindi. Preserve devotional names and repeated sung lines faithfully. Return only the transcription.");

  const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: fd
  });

  if (!r.ok) {
    const detail = await r.text();
    console.error("Transcription failed", r.status, detail.slice(0, 500));
    return json({ error: "Transcription failed" }, 502);
  }

  const data = await r.json();
  const text = String(data?.text || "").trim();
  if (!text) return json({ error: "No transcription returned" }, 502);

  return json({
    draft: true,
    lyrics_devanagari: text,
    source_name: "User-provided voice recording",
    owner_id: user.id
  });
});