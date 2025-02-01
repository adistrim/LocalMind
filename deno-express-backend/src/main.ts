import express, { Request, Response } from "npm:express";
import cors from "npm:cors";
import { PORT, ORIGIN_URL } from "./config.ts";
import { connectDB } from "./database.ts";
import process from "node:process";
import ollmaRouter from "./routes/ollama.ts";

const startServer = async () => {
  try {
    console.log("🚀 Connecting to MongoDB...");

    await connectDB();

    const app = express();

    app.use(cors({
      origin: ORIGIN_URL,
      methods: ["GET", "POST"],
      credentials: false
    }));

    app.use(express.json());
    app.use("/api", ollmaRouter);

    app.get("/", (_req: Request, res: Response) => {
      res.send("Hello World!");
    });

    app.listen(PORT, () => {
      console.log(`🔥 Server is running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("❌ Failed to start the server:", error);
    process.exit(1);
  }
};

startServer();
