<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { marked } from "marked";

  interface Message {
    role: "user" | "assistant";
    content: string;
    isThinking?: boolean;
    thinkingContent?: string;
    showThinking?: boolean;
  }

  let messages: Message[] = [];
  let prompt = "";
  let isGenerating = false;
  let chatContainer: HTMLDivElement;
  let autoScrollEnabled = true;

  const sessionId = "demo-session-1234";

  function scrollToBottom() {
    if (chatContainer && autoScrollEnabled) {
      chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: "smooth",
      });
    }
  }

  function handleScroll() {
    if (!chatContainer) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainer;
    autoScrollEnabled = scrollHeight - (scrollTop + clientHeight) < 50;
  }

  onMount(() => {
    if (chatContainer) {
      chatContainer.addEventListener("scroll", handleScroll);
    }
  });

  onDestroy(() => {
    if (chatContainer) {
      chatContainer.removeEventListener("scroll", handleScroll);
    }
  });

  async function handleSubmit(e?: Event) {
    e?.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    messages = [...messages, { role: "user", content: prompt }];
    const userMessage = prompt;
    prompt = "";
    isGenerating = true;

    messages = [
      ...messages,
      {
        role: "assistant",
        content: "",
        isThinking: true,
        thinkingContent: "",
        showThinking: false,
      },
    ];
    const assistantIndex = messages.length - 1;

    let assistantResponse = "";
    let buffer = "";
    let inThinking = false;

    try {
      const response = await fetch("http://localhost:3000/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "deepseek-r1:14b",
          prompt: userMessage,
          sessionId,
        }),
      });

      if (!response.body) throw new Error("No response body from server.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line) as { response: string };
            let text = data.response;

            if (text.includes("<think>")) {
              inThinking = true;
              text = text.replace("<think>", "");
            }
            if (text.includes("</think>")) {
              inThinking = false;
              text = text.replace("</think>", "");
            }

            if (inThinking) {
              messages[assistantIndex].thinkingContent += text;
            } else {
              assistantResponse += text;
              messages[assistantIndex].content = assistantResponse;
            }
            messages = [...messages];
            scrollToBottom();
          } catch (err) {
            console.error("JSON parse error on line:", line, err);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching or reading stream:", error);
      messages[assistantIndex].content =
        "**Error**: Could not generate a response.";
      messages = [...messages];
    } finally {
      isGenerating = false;
      messages[assistantIndex].isThinking = false;
      messages = [...messages];
      scrollToBottom();
    }
  }

  function clearChat() {
    messages = [];
  }
</script>

<header class="header">
  <div class="model-info">
    <strong>Model:</strong> deepseek-r1:14b
  </div>
  <div class="nav-right">
    <button on:click={clearChat} aria-label="Clear conversation">Clear</button>
  </div>
</header>

<div class="chat-container">
  <div class="messages" bind:this={chatContainer}>
    {#each messages as message, i (i)}
      <div class="message {message.role}">
        {#if message.role === "assistant"}
          <div class="avatar assistant-avatar">🤖</div>
        {:else}
          <div class="avatar user-avatar">👤</div>
        {/if}

        <div class="bubble">
          <div class="markdown">{@html marked(message.content || "")}</div>

          {#if message.thinkingContent && message.thinkingContent.trim()}
            <div
              class="toggle-thinking"
              on:click={() => {
                messages[i].showThinking = !messages[i].showThinking;
                messages = [...messages];
              }}
            >
              {message.showThinking ? "Hide Thinking" : "Show Thinking"}
            </div>

            {#if message.showThinking}
              <div class="thinking-content">
                <pre>{message.thinkingContent}</pre>
              </div>
            {/if}
          {/if}
        </div>
      </div>
    {/each}
  </div>

  <form class="input-form" on:submit|preventDefault={handleSubmit}>
    <textarea
      bind:value={prompt}
      rows="1"
      placeholder="Type your message..."
      on:keydown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSubmit();
        }
      }}
    />
    <button type="submit" disabled={isGenerating || !prompt.trim()}>
      {isGenerating ? "Generating..." : "Send"}
    </button>
  </form>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: sans-serif;
    background: #f4f4f5;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  .model-info {
    font-weight: 500;
  }
  .nav-right button {
    background: none;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
  }

  .chat-container {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 60px);
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  .message {
    display: flex;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .avatar {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 0.5rem;
    font-size: 1.25rem;
  }
  .assistant-avatar {
    background: #e0eaff;
  }
  .user-avatar {
    background: #d9f5d1;
  }

  .message.assistant {
    flex-direction: row;
  }
  .message.user {
    flex-direction: row-reverse;
  }
  .message.user .avatar {
    margin-right: 0;
    margin-left: 0.5rem;
  }

  .bubble {
    max-width: 60%;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    line-height: 1.5;
    word-break: break-word;
  }
  .message.assistant .bubble {
    background: #ffffff;
  }
  .message.user .bubble {
    background: #0070f3;
    color: #fff;
  }

  .toggle-thinking {
    color: #0070f3;
    margin-top: 0.5rem;
    font-size: 0.9rem;
    cursor: pointer;
    text-decoration: underline;
  }
  .thinking-content {
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: #f0f8ff;
    border-radius: 4px;
  }
  .thinking-content pre {
    margin: 0;
    font-size: 0.85rem;
    overflow-x: auto;
  }

  .input-form {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    background: #ffffff;
    border-top: 1px solid #ddd;
  }
  .input-form textarea {
    flex: 1;
    resize: none;
    border-radius: 18px;
    border: 1px solid #ccc;
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    max-height: 150px;
    line-height: 1.4;
    background: #fafafa;
  }
  .input-form button {
    margin-left: 0.75rem;
    background: #0070f3;
    color: #fff;
    border: none;
    border-radius: 18px;
    padding: 0.5rem 1.25rem;
    font-size: 1rem;
    cursor: pointer;
  }
  .input-form button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .markdown :global(p) {
    margin: 0.5rem 0;
  }
  .markdown :global(pre) {
    background: #f6f8fa;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
  }
</style>
