import mongoose from "npm:mongoose";

const ChatSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  model: { type: String, required: true },
  prompt: { type: String, required: true },
  thinking: { type: String },
  answer: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Chat = mongoose.model("Chat", ChatSchema);

export default Chat;
