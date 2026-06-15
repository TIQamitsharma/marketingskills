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
  provider: "anthropic" | "openrouter" | "gemini" | "openai";
  model?: string;
  skillId: string | null;
  productContext: string | null;
  skillName?: string;
  skillDescription?: string;
}

function buildSystemPrompt(
  skillId: string | null,
  skillName: string | undefined,
  skillDescription: string | undefined,
  productContext: string | null,
): string {
  const parts: string[] = [
    "You are an expert AI marketing assistant specializing in growth, conversion optimization, copywriting, SEO, and all aspects of B2B/B2C marketing strategy. You help technical marketers, founders, and product teams execute marketing tasks with precision and expertise.",
  ];

  if (skillId && skillName && skillDescription) {
    parts.push(
      `\n## Active Skill: ${skillName}\n${skillDescription}\n\nFocus your responses on ${skillName} tasks. Provide specific, actionable recommendations structured clearly.`,
    );
  }

  if (productContext) {
    parts.push(
      `\n## Product Marketing Context\n\nThe user has provided product context. Use this to personalize all recommendations:\n\n${productContext}`,
    );
  }

  parts.push(
    `\n## Response Guidelines\n- Be specific and actionable, not generic\n- Structure responses with clear sections and headers when appropriate\n- Prioritize recommendations by impact\n- Use the customer's language when possible\n- Ask clarifying questions when you need more information to give useful advice`,
  );

  return parts.join("\n");
}

async function callAnthropic(
  messages: Message[],
  systemPrompt: string,
  apiKey: string,
  model: string,
): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { error?: { message?: string } }).error?.message ?? `Anthropic API error ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json() as { content: Array<{ type: string; text: string }> };
  return data.content[0]?.text ?? "";
}

async function callOpenRouter(
  messages: Message[],
  systemPrompt: string,
  apiKey: string,
  model: string,
): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://marketingskills.app",
      "X-Title": "MarketingSkills",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { error?: { message?: string } }).error?.message ?? `OpenRouter API error ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message?.content ?? "";
}

async function callGemini(
  messages: Message[],
  systemPrompt: string,
  apiKey: string,
  model: string,
): Promise<string> {
  const geminiMessages = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: geminiMessages,
        generationConfig: { maxOutputTokens: 4096 },
      }),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { error?: { message?: string } }).error?.message ?? `Gemini API error ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json() as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };
  return data.candidates[0]?.content?.parts[0]?.text ?? "";
}

async function callOpenAI(
  messages: Message[],
  systemPrompt: string,
  apiKey: string,
  model: string,
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { error?: { message?: string } }).error?.message ?? `OpenAI API error ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message?.content ?? "";
}

const DEFAULT_MODELS: Record<string, string> = {
  anthropic: "claude-3-5-sonnet-20241022",
  openrouter: "anthropic/claude-3.5-sonnet",
  gemini: "gemini-1.5-pro",
  openai: "gpt-4o",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const { messages, apiKey, provider = "anthropic", model, skillId, productContext, skillName, skillDescription } = body;

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

    const systemPrompt = buildSystemPrompt(skillId, skillName, skillDescription, productContext);
    const resolvedModel = model ?? DEFAULT_MODELS[provider] ?? DEFAULT_MODELS.anthropic;

    let text = "";
    switch (provider) {
      case "openrouter":
        text = await callOpenRouter(messages, systemPrompt, apiKey, resolvedModel);
        break;
      case "gemini":
        text = await callGemini(messages, systemPrompt, apiKey, resolvedModel);
        break;
      case "openai":
        text = await callOpenAI(messages, systemPrompt, apiKey, resolvedModel);
        break;
      default:
        text = await callAnthropic(messages, systemPrompt, apiKey, resolvedModel);
    }

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
