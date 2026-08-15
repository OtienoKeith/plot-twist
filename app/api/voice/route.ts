type VoiceRequest = { text?: string; mood?: "host" | "excited" | "tease" };

export async function POST(request: Request) {
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

    if (!response.ok) {
      console.error(JSON.stringify({ event: "voice_provider_error", status: response.status }));
      return Response.json({ error: "Narrator unavailable." }, { status: 502 });
    }
    return new Response(response.body, {
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "audio/wav",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(JSON.stringify({ event: "voice_request_error", message: error instanceof Error ? error.message : "unknown" }));
    return Response.json({ error: "Narrator unavailable." }, { status: 502 });
  }
}

