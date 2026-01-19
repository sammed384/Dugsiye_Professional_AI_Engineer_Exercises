import Replicate from "replicate";
import dotenv from "dotenv";
import readline from "readline";

dotenv.config();

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const prompt = (question) =>
  new Promise((resolve) => rl.question(question, resolve));

// Store conversation history for context
let conversationHistory = [];
let currentOutline = "";
let currentTopic = "";
let temperature = 0.7; // Default temperature

/**
 * Generate blog post outline with streaming
 */
async function generateOutline(topic) {
  console.log("\n📝 Generating blog post outline...\n");

  const systemPrompt = `You are an expert content strategist. Create a detailed blog post outline for the given topic. 
Include:
- A compelling title
- Introduction hook
- 5-7 main sections with bullet points
- Key takeaways
- Conclusion`;

  const input = {
    prompt: `${systemPrompt}\n\nUser: Create a blog post outline for: ${topic}\nAssistant:`,
    temperature: temperature,
    max_tokens: 1000,
  };

  const output = await replicate.stream("meta/meta-llama-3-8b-instruct", {
    input,
  });

  let fullResponse = "";
  for await (const event of output) {
    process.stdout.write(event.toString());
    fullResponse += event.toString();
  }

  console.log("\n");
  conversationHistory.push({
    role: "user",
    content: `Create a blog post outline for: ${topic}`,
  });
  conversationHistory.push({ role: "assistant", content: fullResponse });
  return fullResponse;
}

/**
 * Summarize the outline in 2 sentences
 */
async function summarizeOutline(outline) {
  console.log("📋 Summary:\n");

  const input = {
    prompt: `You are a concise summarizer. Summarize content in exactly 2 sentences.\n\nUser: Summarize this blog outline in exactly 2 sentences:\n\n${outline}\nAssistant:`,
    temperature: temperature,
    max_tokens: 200,
  };

  const output = await replicate.stream("meta/meta-llama-3-8b-instruct", {
    input,
  });

  let summary = "";
  for await (const event of output) {
    process.stdout.write(event.toString());
    summary += event.toString();
  }

  console.log("\n");
  return summary;
}

/**
 * Answer follow-up questions with context
 */
async function answerFollowUp(question) {
  console.log("\n💡 Response:\n");

  // Construct context from history (simplified for Llama 3 prompt structure)
  // Llama 3 works best with a specific prompt format, but for simplicity we'll append history.
  // A more robust implementation would format the full chat history into the prompt.

  let context = "";
  for (const msg of conversationHistory) {
    context += `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}\n`;
  }

  const input = {
    prompt: `You are an expert content strategist.\n\n${context}\nUser: ${question}\nAssistant:`,
    temperature: temperature,
    max_tokens: 500,
  };

  const output = await replicate.stream("meta/meta-llama-3-8b-instruct", {
    input,
  });

  let answer = "";
  for await (const event of output) {
    process.stdout.write(event.toString());
    answer += event.toString();
  }

  console.log("\n");
  conversationHistory.push({ role: "user", content: question });
  conversationHistory.push({ role: "assistant", content: answer });
  return answer;
}

/**
 * Main application loop
 */
async function main() {
  console.log("╔════════════════════════════════════════════╗");
  console.log("║     🚀 Smart Content Assistant             ║");
  console.log("║     Your AI-Powered Blog Outline Creator   ║");
  console.log("╚════════════════════════════════════════════╝\n");

  try {
    // Select content mode (temperature)
    console.log("🎨 Content Mode:");
    console.log("   [1] Creative (imaginative, varied output)");
    console.log("   [2] Balanced (default)");
    console.log("   [3] Factual (precise, focused output)\n");

    const modeChoice = await prompt("Select mode (1-3, default: 2): ");

    switch (modeChoice.trim()) {
      case "1":
        temperature = 0.9;
        console.log("✨ Creative mode selected (temperature: 0.9)\n");
        break;
      case "3":
        temperature = 0.3;
        console.log("📊 Factual mode selected (temperature: 0.3)\n");
        break;
      default:
        temperature = 0.7;
        console.log("⚖️  Balanced mode selected (temperature: 0.7)\n");
    }

    // Get topic from user
    currentTopic = await prompt("📌 Enter a topic for your blog post: ");

    if (!currentTopic.trim()) {
      console.log("No topic provided. Exiting...");
      rl.close();
      return;
    }

    // Generate outline with streaming
    currentOutline = await generateOutline(currentTopic);

    // Summarize the outline
    await summarizeOutline(currentOutline);

    // Follow-up questions loop
    console.log("━".repeat(50));
    console.log("💬 You can now ask follow-up questions about this topic.");
    console.log("   Type 'exit' to quit, or 'new' for a new topic.\n");

    while (true) {
      const userInput = await prompt("You: ");

      if (userInput.toLowerCase() === "exit") {
        console.log(
          "\n👋 Thanks for using Smart Content Assistant! Goodbye!\n",
        );
        break;
      }

      if (userInput.toLowerCase() === "new") {
        currentTopic = await prompt("\n📌 Enter a new topic: ");
        if (currentTopic.trim()) {
          currentOutline = await generateOutline(currentTopic);
          await summarizeOutline(currentOutline);
          console.log("━".repeat(50));
          console.log("💬 Ask follow-up questions or type 'exit' to quit.\n");
        }
        continue;
      }

      if (!userInput.trim()) {
        continue;
      }

      await answerFollowUp(userInput);
    }
  } catch (error) {
    console.error("\n❌ Error:", error.message);
  } finally {
    rl.close();
  }
}

// Run the application
main();
