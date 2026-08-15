type PlayRequest = {
  problem?: string;
  stickers?: string[];
  turn?: number;
  callbacks?: string[];
};

const outcomes = [
  (a:string,b:string,c:string) => `You distract the problem with ${a}, disguise ${b} as the manager, and appoint ${c} head of security. It works for reasons no one can legally explain.`,
  (a:string,b:string,c:string) => `${a} starts the plan, ${b} immediately misunderstands it, and ${c} somehow receives all the credit. Disaster avoided. Mostly.`,
  (a:string,b:string,c:string) => `You combine ${a}, ${b}, and ${c} into a deeply suspicious invention. Everyone agrees not to ask questions while it saves the day.`,
  (a:string,b:string,c:string) => `${a} challenges the villain to a dance-off while ${b} handles negotiations. ${c} presses one forbidden button. Problem solved; new problem unlocked.`,
];

const nextProblems = [
  "The solution worked, but now the neighborhood cats believe you are their elected mayor.",
  "A tiny lawyer arrives and claims the moon owes her twelve cupcakes.",
  "Every door now leads to the same extremely judgmental gift shop.",
  "The town fountain has started dispensing glitter and unsolicited advice.",
  "A suspiciously confident frog has challenged you to a televised talent show.",
  "Your shadow has started a band and booked a concert in your kitchen.",
  "The clouds have misplaced Tuesday and insist it is somewhere in your backpack.",
  "A royal pigeon delivers an invitation to a party that happened tomorrow.",
];

function hash(text:string) {
  return [...text].reduce((total, char) => (total * 31 + char.charCodeAt(0)) >>> 0, 7);
}

function fallback(body:PlayRequest) {
  const labels = (body.stickers || ["a frog", "a cupcake", "a crown"]).map((item) => item.replace(/^\S+\s/, "").toLowerCase());
  const seed = hash(`${body.problem}${labels.join("")}${body.turn}`);
  return {
    reaction: outcomes[seed % outcomes.length](labels[0], labels[1], labels[2]),
    nextSituation: nextProblems[(seed + (body.turn || 1)) % nextProblems.length],
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as PlayRequest;
  if (!body.problem || !Array.isArray(body.stickers) || body.stickers.length !== 3) {
    return Response.json({ error: "Choose exactly three stickers." }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return Response.json(fallback(body));

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        temperature: 0.9,
        max_completion_tokens: 170,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You direct a joyful all-ages comedy game. The player solves an absurd problem with exactly three stickers. Make all three objects essential, reward unusual thinking, and carry one memorable object or character into the next scene so the story feels continuous. Escalate the absurdity gradually without repeating situations. Never shame the player; avoid violence, danger, romance, politics, brands, or medical themes. Return strict JSON with reaction (2 funny sentences, max 55 words) and nextSituation (1 absurd sentence, max 22 words). The next situation must follow from the reaction and enable endless play." },
          { role: "user", content: JSON.stringify({ currentProblem: body.problem, chosenStickers: body.stickers, storyTurn: body.turn, recentCallbacks: (body.callbacks || []).slice(-2) }) },
        ],
      }),
    });
    if (!response.ok) return Response.json(fallback(body));
    const data = await response.json() as { choices?: { message?: { content?: string } }[] };
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    if (!parsed.reaction || !parsed.nextSituation) return Response.json(fallback(body));
    return Response.json({ reaction: String(parsed.reaction).slice(0, 500), nextSituation: String(parsed.nextSituation).slice(0, 240) });
  } catch {
    return Response.json(fallback(body));
  }
}
