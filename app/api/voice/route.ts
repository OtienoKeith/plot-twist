type VoiceRequest = { text?: string; mood?: "host" | "excited" | "tease" };

const requests = new Map<string, { count: number; reset: number }>();

function allowRequest(ip: string) {
  const now = Date.now();
  const current = requests.get(ip);
  if (!current || current.reset < now) {
    requests.set(ip, { count: 1, reset: now + 60_000 });
    return true;
  }
  if (current.count >= 8) return false;
  current.count += 1;
  return true;
}

export async function POST(request: Request) {
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "local";
  if (!allowRequest(ip)) return Response.json({ error: "Voice is catching its breath." }, { status: 429 });

  const body = (await request.json()) as VoiceRequest;
  const text = String(body.text || "").replace(/\s+/g, " ").trim().slice(0, 200);
  if (!text) return Response.json({ error: "Nothing to narrate." }, { status: 400 });

  const key = process.env.GROQ_API_KEY;
  if (!key) return Response.json({ error: "Narrator is not configured." }, { status: 503 });

  const direction = body.mood === "tease" ? "[mischievous]" : "[cheerful]";

  try {
    const response = await fetch("https://api.groq.com/openai/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "canopylabs/orpheus-v1-english",
        voice: "hannah",
        input: `${direction} ${text}`,
        response_format: "wav",
      }),
    });

    if (!response.ok) return Response.json({ error: "Narrator unavailable." }, { status: 502 });
    return new Response(await response.arrayBuffer(), {
      headers: { "Content-Type": "audio/wav", "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "Narrator unavailable." }, { status: 502 });
  }
}
