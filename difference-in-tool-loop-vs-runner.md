The two approaches do the **same thing**. The difference is **who manages the tool loop**.

| Manual Tool Loop                            | Tool Runner                                           |                        |
| ------------------------------------------- | ----------------------------------------------------- | ---------------------- |
| You define JSON schemas manually.           | Schemas are generated from your TypeScript functions. |                        |
| You check `stop_reason === "tool_use"`.     | Done automatically.                                   |                        |
| You call `runTool()` yourself.              | Runner invokes your functions automatically.          |                        |
| You create `tool_result` messages yourself. | Runner sends tool results automatically.              |                        |
| You maintain the `messages` array.          | Runner manages conversation history.                  |                        |
| You write the `while(true)` loop.           | Runner has the loop internally.                       |                        |
| More control.                               | Less code.                                            | ([Claude Platform][1]) |

### Manual

You write everything:

```ts
while (true) {
    const response = await client.messages.create(...);

    if (response.stop_reason !== "tool_use")
        break;

    const result = await runTool(...);

    messages.push({
        role: "user",
        content: [{
            type: "tool_result",
            ...
        }]
    });
}
```

You're responsible for:

* parsing tool calls
* executing tools
* handling errors
* sending results back
* updating conversation history

---

### Tool Runner

You only provide functions:

```ts
const runner = client.beta.messages.toolRunner({
    model: "...",
    messages,
    tools: [getWeather, getForecast],
});

const finalMessage = await runner.untilDone();
```

Internally, the SDK does something conceptually like:

```ts
while (true) {
    const response = await client.messages.create(...);

    if (response.stop_reason !== "tool_use")
        return response;

    for (const toolCall of response.toolCalls) {
        const result = await executeFunction(toolCall);
        sendToolResult(result);
    }
}
```

All of that is hidden from your code. ([Claude Platform][1])

### When to use which?

**Use Tool Runner** if:

* You have normal TypeScript functions.
* You want the simplest implementation.
* You don't need to intercept every tool call.

**Use the Manual Loop** if you need:

* Human approval before executing a tool.
* Logging every tool call.
* Conditional execution (e.g., deny certain tools).
* Retry logic.
* Custom error handling.
* Custom message history management.
* Integration with your own agent framework. ([Claude Platform][1])

So the **model behavior is identical**. The only difference is that **Tool Runner is a convenience layer built on top of the manual tool-use protocol**. It automates the request → tool execution → tool result → next request cycle that you'd otherwise write yourself. ([Claude Platform][1])

[1]: https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-runner?utm_source=chatgpt.com "Tool Runner (SDK) - Claude Platform Docs"
