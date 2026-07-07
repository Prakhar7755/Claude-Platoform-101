Got it — you mean the **built-in Claude tools that Anthropic provides**, not custom tool calls.

Here’s the clean mental model + code.

---

# 🧠 Built-in “Client Tools” (Memory, Bash, Computer Use)

These are tools where:

* You **DO NOT implement the tool logic**
* You only **enable them in `tools`**
* Claude produces `tool_use`
* The SDK or your runtime handles execution (or it’s partially handled depending on tool)

---

# 1. 🧠 Memory Tool (persistent across chats)

Claude can store/retrieve long-term info.

### Code

```ts id="memory_tool"
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const response = await client.messages.create({
  model: "claude-opus-4-8",
  max_tokens: 1024,

  tools: [
    {
      type: "memory_20250818",
      name: "memory",
    },
  ],

  messages: [
    {
      role: "user",
      content: "Remember that I prefer short answers.",
    },
  ],
});

console.log(response.content);
```

👉 Key point:
You **do NOT implement memory storage**. Claude issues commands like:

* `create`
* `update`
* `view`

Your system just executes them. ([Claude Platform][1])

---

# 2. 💻 Bash Tool (persistent terminal)

Claude can run shell commands in a session.

### Code

```ts id="bash_tool"
const response = await client.messages.create({
  model: "claude-opus-4-8",
  max_tokens: 1024,

  tools: [
    {
      type: "bash_20250124",
      name: "bash",
    },
  ],

  messages: [
    {
      role: "user",
      content: "List all files and show git status",
    },
  ],
});

for (const block of response.content) {
  if (block.type === "tool_use") {
    console.log("COMMAND:", block.input);
  }

  if (block.type === "bash_code_execution_tool_result") {
    console.log("OUTPUT:", block.content);
  }
}
```

👉 Key idea:

* Bash is a **persistent session terminal**
* Claude can `cd`, then reuse that state later ([Claude Documentation][2])

---

# 3. 🖥️ Computer Use (UI control / agent desktop)

Claude controls a virtual computer:

* mouse
* keyboard
* screenshots
* browser actions

### Code (minimal setup)

```ts id="computer_use"
const response = await client.messages.create({
  model: "claude-opus-4-8",
  max_tokens: 1024,

  tools: [
    {
      type: "computer_20250124",
      name: "computer",
    },
  ],

  messages: [
    {
      role: "user",
      content: "Open a browser and search for weather in Tokyo",
    },
  ],
});

console.log(response.content);
```

👉 Important:

* You must run the **actual OS/VM environment**
* Claude only sends actions like:

  * click
  * type
  * screenshot

It does NOT execute them itself ([WebFiddle][3])

---

# 4. 🧩 What all built-in tools have in common

## They all follow this pattern:

### Step 1 — Claude requests action

```json
{
  "type": "tool_use",
  "name": "bash",
  "input": {
    "command": "ls"
  }
}
```

### Step 2 — Your system OR runtime executes it

### Step 3 — Result goes back as:

```json
{
  "type": "tool_result",
  "content": "file1.txt file2.txt"
}
```

---

# 5. ⚠️ The BIG difference vs custom tools

| Type         | Who runs it                   | Example          |
| ------------ | ----------------------------- | ---------------- |
| Custom tool  | YOU                           | database, API    |
| Memory       | YOU (handler provided by SDK) | file/db storage  |
| Bash         | YOU (sandboxed runtime)       | shell commands   |
| Computer use | YOU (VM/UI env)               | clicking browser |
| Web search   | Anthropic                     | no your code     |

---

# 6. 🧠 One-line summary

* **Memory** → persistent knowledge store
* **Bash** → terminal environment
* **Computer use** → virtual desktop agent
* **Web search/fetch** → hosted by Anthropic
* **Custom tools** → fully your responsibility

---

If you want, I can next show you:

👉 how all 4 tools run together in ONE agent loop (this is where it finally “clicks”)

[1]: https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool?fcdaa149_sort_date=desc&utm_source=chatgpt.com "Memory tool - Claude Platform Docs"
[2]: https://cld-docs.onlinetool.cc/en/docs/agents-and-tools/tool-use/bash-tool.html?utm_source=chatgpt.com "Bash tool - Claude Documentation"
[3]: https://webfiddle.net/cats-d8c4vu/docs.anthropic.com/en/docs/build-with-claude/computer-use?utm_source=chatgpt.com "Computer use tool - Claude API Docs"
