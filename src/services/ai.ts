import OpenAI from "openai";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const MODEL_NAME = "deepseek-chat";
const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const SYSTEM_PROMPT_PATH = resolve(__dirname, "../../src/prompts/prompt.md");

let deepSeekClient: OpenAI | undefined;

/**
 * Creates the DeepSeek API client on first use so importing this module does
 * not require credentials until the application actually makes an AI request.
 */
function getDeepSeekClient(): OpenAI {
  if (deepSeekClient) {
    return deepSeekClient;
  }

  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not set. Add it to the environment before requesting an AI response.");
  }

  deepSeekClient = new OpenAI({
    apiKey,
    baseURL: DEEPSEEK_BASE_URL,
  });
  return deepSeekClient;
}

/**
 * Sends a user's message to DeepSeek together with the system instructions
 * stored in src/prompts/prompt.md, and returns the model's plain-text response.
 */
export async function askDeepSeek(userMessage: string): Promise<string> {
  if (!userMessage.trim()) {
    throw new Error("Cannot send an empty message to DeepSeek.");
  }

  // Read the prompt for each request so prompt edits take effect without restarting the bot.
  const systemPrompt = await readFile(SYSTEM_PROMPT_PATH, "utf8");
  const completion = await getDeepSeekClient().chat.completions.create({
    model: MODEL_NAME,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  // Report an empty model response as a failure instead of sending a blank message.
  const responseText = completion.choices[0]?.message.content?.trim();
  if (!responseText) {
    throw new Error("DeepSeek returned an empty response.");
  }

  return responseText;
}
