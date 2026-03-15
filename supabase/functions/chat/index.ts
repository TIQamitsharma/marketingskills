import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages: Message[];
  apiKey: string;
  skillId: string | null;
  productContext: string | null;
  skillName?: string;
  skillDescription?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const { messages, apiKey, skillId, productContext, skillName, skillDescription } = body;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "No API key provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemParts: string[] = [];

    systemParts.push(
      "You are an expert AI marketing assistant specializing in growth, conversion optimization, copywriting, SEO, and all aspects of B2B/B2C marketing strategy. You help technical marketers, founders, and product teams execute marketing tasks with precision and expertise."
    );

    if (skillId && skillName && skillDescription) {
      systemParts.push(
        `\n## Active Skill: ${skillName}\n${skillDescription}\n\nFocus your responses on ${skillName} tasks. Provide specific, actionable recommendations structured clearly.`
      );
    }

    if (productContext) {
      systemParts.push(
        `\n## Product Marketing Context\n\nThe user has provided product context. Use this to personalize all recommendations:\n\n${productContext}`
      );
    }

    systemParts.push(
      `\n## Response Guidelines\n- Be specific and actionable, not generic\n- Structure responses with clear sections and headers when appropriate\n- Prioritize recommendations by impact\n- Use the customer's language when possible\n- Ask clarifying questions when you need more information to give useful advice`
    );

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        system: systemParts.join("\n"),
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = (err as { error?: { message?: string } }).error?.message ?? `API error ${response.status}`;
      return new Response(JSON.stringify({ error: msg }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json() as {
      content: Array<{ type: string; text: string }>;
    };
    const text = data.content[0]?.text ?? "";

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
