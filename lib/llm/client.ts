import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return _client;
}

export interface LLMResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
}

export async function callClaude(
  systemPrompt: string,
  userPrompt: string
): Promise<LLMResponse> {
  const client = getClient();

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  const content = textBlock ? textBlock.text : "";

  return {
    content,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };
}
