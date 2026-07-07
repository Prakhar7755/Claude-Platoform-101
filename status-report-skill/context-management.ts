import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
dotenv.config();

const apiKey = (globalThis as any).process?.env?.ANTHROPIC_API_KEY;
const client = new Anthropic({
  apiKey: apiKey!,
});

/**
 * 🧠 Persistent conversation state (context)
 */
const messages: Anthropic.Messages.MessageParam[] = [
  {
    role: "system",
    content:
      "You are a helpful assistant that manages long-running tasks efficiently.",
  },
];

/**
 * 🧰 Example tool (just-in-time context pattern)
 */
async function lookup_building_code(section: string) {
  // pretend DB / API call
  return `Building code section ${section}: ...`;
}

/**
 * 🔁 Tool dispatcher
 */
async function runTool(name: string, input: any) {
  switch (name) {
    case "lookup_building_code":
      return await lookup_building_code(input.section);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * 🧠 Main chat loop with context management
 */
export async function chat(userInput: string) {
  messages.push({
    role: "user",
    content: userInput,
  });

  const response = await client.beta.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,

    messages,

    /**
     * 🟡 Pattern 2: Server-side compaction
     * Automatically summarizes old context when needed
     */
    context_management: {
      edits: [
        {
          type: "compact",
        },
      ],
    },

    /**
     * 🧰 Tool enables just-in-time context loading
     */
    tools: [
      {
        name: "lookup_building_code",
        description: "Fetch a building code section",
        input_schema: {
          type: "object",
          properties: {
            section: { type: "string" },
          },
          required: ["section"],
        },
      },
    ],
  });

  /**
   * Save assistant response back into context
   */
  messages.push({
    role: "assistant",
    content: response.content,
  });

  /**
   * Handle tool calls (if any)
   */
  const toolResults: any[] = [];

  for (const block of response.content) {
    if (block.type === "tool_use") {
      const result = await runTool(block.name, block.input);

      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: result,
      });
    }
  }

  /**
   * If tools were used → send results back (context grows safely)
   */
  if (toolResults.length > 0) {
    const followup = await client.beta.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [
        ...messages,
        {
          role: "user",
          content: toolResults,
        },
      ],
      context_management: {
        edits: [{ type: "compact" }],
      },
    });

    messages.push({
      role: "assistant",
      content: followup.content,
    });

    return followup;
  }

  return response;
}