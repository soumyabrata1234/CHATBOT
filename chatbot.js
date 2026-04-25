import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { ChatMessageHistory } from "langchain/stores/message/in_memory";

// ─── Initialize Gemini LLM via LangChain ───────────────────────────────────
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
  streaming: true,
  temperature: 0.7,
  maxOutputTokens: 1024,
});

//  System Prompt 
const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a helpful, friendly, and concise AI assistant. 
You remember the context of the conversation and provide thoughtful responses.
Keep your answers clear and to the point. If you don't know something, say so honestly.`,
  ],
  new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
]);

// ─── Build the Chain 
const chain = prompt.pipe(llm);

//  Session-based Message History Store 
const sessionHistories = {};

function getSessionHistory(sessionId) {
  if (!sessionHistories[sessionId]) {
    sessionHistories[sessionId] = new ChatMessageHistory();
  }
  return sessionHistories[sessionId];
}

//  Chain with Persistent Memory 
const chainWithHistory = new RunnableWithMessageHistory({
  runnable: chain,
  getMessageHistory: getSessionHistory,
  inputMessagesKey: "input",
  historyMessagesKey: "chat_history",
});

//Chat Function
export async function chat(userMessage, sessionId = "default") {
  process.stdout.write("\n🤖 Assistant: ");

  let fullResponse = "";

  const stream = await chainWithHistory.stream(
    { input: userMessage },
    { configurable: { sessionId } }
  );

  for await (const chunk of stream) {
    const text = chunk.content || "";
    process.stdout.write(text);
    fullResponse += text;
  }

  process.stdout.write("\n");
  return fullResponse;
}

// Clear Session History 
export function clearHistory(sessionId = "default") {
  if (sessionHistories[sessionId]) {
    delete sessionHistories[sessionId];
  }
}

// Get History Summary 
export async function getHistoryLength(sessionId = "default") {
  const history = getSessionHistory(sessionId);
  const messages = await history.getMessages();
  return messages.length;
}
