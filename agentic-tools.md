Yes. The core idea of an agentic workflow is simply a **loop**:

```
User
  ↓
LLM
  ↓
Needs a tool?
 ├── No → Final answer → End
 └── Yes
       ↓
   Your code runs the tool
       ↓
   Send tool result back to LLM
       ↓
      Repeat
```

The "agent" isn't magic—it's just repeatedly asking the model, "What next?" until the model says it's finished.

---

# Even Simpler Example

Imagine Claude has only one tool:

```text
add(a, b)
```

If the user asks:

> What is 15 + 27?

The conversation becomes

```
User
 ↓
Claude
 ↓
"I want to call add(15,27)"
 ↓
Your code executes

add(15,27)
→ 42

 ↓
Send result back

"The tool returned 42"

 ↓
Claude

"The answer is 42."
```

That's literally an agent loop.

---

# JavaScript Version (Simple)

```javascript
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const tools = [
  {
    name: "add",
    description: "Add two numbers",
    input_schema: {
      type: "object",
      properties: {
        a: { type: "number" },
        b: { type: "number" },
      },
      required: ["a", "b"],
    },
  },
];

function runTool(name, input) {
  if (name === "add") {
    return String(input.a + input.b);
  }

  throw new Error("Unknown tool");
}

const messages = [
  {
    role: "user",
    content: "What is 25 + 18?",
  },
];

async function runAgent() {
  while (true) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      tools,
      messages,
    });

    if (response.stop_reason === "end_turn") {
      console.log(response.content[0].text);
      break;
    }

    if (response.stop_reason === "tool_use") {
      const toolResults = [];

      for (const block of response.content) {
        if (block.type !== "tool_use") continue;

        const result = runTool(block.name, block.input);

        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: result,
        });
      }

      messages.push({
        role: "assistant",
        content: response.content,
      });

      messages.push({
        role: "user",
        content: toolResults,
      });
    }
  }
}

runAgent();
```

---

# What actually happens?

### Iteration 1

You send

```text
User:
What is 25 + 18?
```

Claude replies

```text
Use tool:

add
{
  "a":25,
  "b":18
}
```

Notice Claude **doesn't know** the answer yet.

---

### Your code runs

```javascript
runTool("add", {
    a:25,
    b:18
});
```

returns

```
43
```

---

### Iteration 2

Now you send

```text
Assistant:
(tool request)

User:
tool_result = 43
```

Claude now replies

```text
25 + 18 = 43.
```

and

```
stop_reason = end_turn
```

The loop ends.

---

# Why the loop?

Because Claude may need **multiple** tools.

Example:

```
User:
Should I carry an umbrella today?
```

Claude might do

```
get_location()
```

↓

```
Lucknow
```

↓

```
get_weather("Lucknow")
```

↓

```
Rain
```

↓

```
Final answer:
Yes, take an umbrella.
```

One tool wasn't enough.

---

Or

```
User:
What's Tesla's current stock price in INR?
```

Claude may call

```
get_stock_price()
```

↓

```
USD 345
```

↓

```
get_exchange_rate()
```

↓

```
86.1
```

↓

```
Final answer:
₹29,700
```

Again, two iterations.

---

# Why append to `messages`?

This is the part that confuses most people.

Suppose Claude asked:

```text
Use get_weather(city="Austin")
```

If you only send back

```text
Weather: Sunny
```

Claude won't know **which tool call** you're answering.

Instead you append **both** the assistant's request and your tool result:

```javascript
messages.push({
    role: "assistant",
    content: response.content
});

messages.push({
    role: "user",
    content: [{
        type: "tool_result",
        tool_use_id: "...",
        content: "Sunny"
    }]
});
```

Now Claude sees the complete conversation:

```
User:
Should I wear a jacket?

Assistant:
Use get_weather(Austin)

User:
Tool returned:
Sunny, 95°F

Assistant:
No, wear light clothes.
```

The model maintains context naturally through the conversation history.

---

# The general agent pattern

Almost every tool-using LLM agent follows this same structure:

```javascript
messages = [user message]

while (true) {

    response = LLM(messages)

    if (response.isFinal())
        break

    toolCalls = response.toolCalls

    results = []

    for (toolCall of toolCalls)
        results.push(runTool(toolCall))

    messages.push(response)

    messages.push(toolResults)
}
```

Frameworks like **LangChain**, **LlamaIndex**, **OpenAI Agents SDK**, and **Anthropic's agent examples** all build on this same fundamental loop. They mainly add conveniences such as memory management, retries, parallel tool execution, planning, and orchestration, but the core workflow remains: **LLM → tool call(s) → tool execution → tool result → LLM**, repeated until the model produces a final answer.
