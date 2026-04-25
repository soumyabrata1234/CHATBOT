import "dotenv/config";
import readline from "readline";
import { chat, clearHistory, getHistoryLength } from "./chatbot.js";


if (!process.env.GEMINI_API_KEY) {
  console.error("❌ Error: GEMINI_API_KEY is not set in your .env file.");
  console.error("   Copy .env.example to .env and add your Gemini API key.");
  process.exit(1);
}



// ─── CLI Setup ──────────────────────────────────────────────────────────────
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const SESSION_ID = `session_${Date.now()}`;


function printBanner() {
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║     🤖  Gemini AI Chatbot (LangChain.js)     ║");
  console.log("╠══════════════════════════════════════════════╣");
  console.log("║  Commands:                                   ║");
  console.log("║    /clear  → Clear conversation history      ║");
  console.log("║    /history → Show message count             ║");
  console.log("║    /exit   → Exit the chatbot                ║");
  console.log("╚══════════════════════════════════════════════╝\n");
}

async function main() {
  printBanner();

  console.log("💬 Start chatting! The bot remembers your conversation.\n");

  const askQuestion = () => {
    rl.question("👤 You: ", async (input) => {
      const trimmed = input.trim();

      if (!trimmed) {
        askQuestion();
        return;
      }

      
      if (trimmed === "/exit") {
        console.log("\n👋 Goodbye! Have a great day!\n");
        rl.close();
        process.exit(0);
      }

      if (trimmed === "/clear") {
        clearHistory(SESSION_ID);
        console.log("🧹 Conversation history cleared!\n");
        askQuestion();
        return;
      }

      if (trimmed === "/history") {
        const count = await getHistoryLength(SESSION_ID);
        console.log(`📊 Messages in history: ${count}\n`);
        askQuestion();
        return;
      }

       
      try {
        await chat(trimmed, SESSION_ID);
        console.log(); // spacing
      } catch (error) {
        if (error.message?.includes("API_KEY_INVALID")) {
          console.error("\n❌ Invalid Gemini API key. Check your .env file.\n");
        } else if (error.message?.includes("QUOTA_EXCEEDED")) {
          console.error("\n❌ Gemini API quota exceeded. Try again later.\n");
        } else {
          console.error(`\n❌ Error: ${error.message}\n`);
        }
      }

      askQuestion();
    });
  };

  askQuestion();
}

main();
