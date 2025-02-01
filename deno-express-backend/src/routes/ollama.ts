import { Router, Request, Response } from "npm:express";
import { connectDB } from "../database.ts";
import Chat from "../models/chat.ts";
import parseResponse from "../services/parseResponse.ts";
import { generateSessionId } from "../services/generateSessionId.ts";

await connectDB();

const router = Router();

router.post("/generate", async (req: Request, res: Response) => {
  try {
    const { sessionId, model, prompt } = req.body;

    if (!model || !prompt) {
      return res
        .status(400)
        .json({ error: "Please provide both model and prompt" });
    }

    const upstreamResponse = await fetch("http://localhost:8080/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: true }),
    });

    if (!upstreamResponse.ok || !upstreamResponse.body) {
      return res
        .status(500)
        .json({ error: `Upstream request failed: ${upstreamResponse.statusText}` });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = upstreamResponse.body.getReader();
    const decoder = new TextDecoder();

    let responseBuffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      responseBuffer += chunk;
      res.write(chunk);
      console.log(chunk);
    }

    const { thinking, answer } = parseResponse(responseBuffer);

    const chatDoc = new Chat({
      sessionId: sessionId || generateSessionId(),
      model,
      prompt,
      thinking,
      answer,
    });
    await chatDoc.save();

    res.end();
  } catch (error) {
    console.error("Error in /generate route:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;

