import OpenAI from "openai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

class AIContentStudio {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OPENAI_API_KEY is missing in .env file.");
      process.exit(1);
    }
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.stats = {
      totalCost: 0,
      startTime: Date.now(),
      operations: 0,
      timings: {},
    };
    this.baseOutputDir = path.join(process.cwd(), "content_suite");
    this.currentOutputDir = "";
  }

  async init(topic) {
    if (!fs.existsSync(this.baseOutputDir)) {
      fs.mkdirSync(this.baseOutputDir, { recursive: true });
    }
    const folderName = topic.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    this.currentOutputDir = path.join(this.baseOutputDir, folderName);
    if (!fs.existsSync(this.currentOutputDir)) {
      fs.mkdirSync(this.currentOutputDir, { recursive: true });
    }
    console.log(`🚀 AI Content Studio Initialized for: ${topic}`);
  }

  trackOperation(model, cost) {
    this.stats.operations++;
    this.stats.totalCost += cost;
    console.log(`💰 Operation: ${model} | Cost: $${cost.toFixed(4)}`);
  }

  async retry(fn, retries = 3, delay = 2000) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err) {
        if (i === retries - 1) throw err;
        console.warn(`⚠️ Attempt ${i + 1} failed. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  async generateText(topic) {
    const start = Date.now();
    console.log(`📝 Generating content for: ${topic}...`);
    try {
      const response = await this.retry(() =>
        this.openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "You are a professional content creator. Output ONLY valid JSON.",
            },
            {
              role: "user",
              content: `Create a content suite for: "${topic}". 
              Include:
              1. A 500-word article.
              2. A 2-sentence summary.
              3. Three social media posts (Twitter, LinkedIn, Instagram).
              Format: {"article": "...", "summary": "...", "socialPosts": ["...", "...", "..."]}`,
            },
          ],
          response_format: { type: "json_object" },
        }),
      );

      const content = JSON.parse(response.choices[0].message.content);
      // GPT-4o pricing: $5/1M input, $15/1M output (approximate for this small usage)
      this.trackOperation("gpt-4o", 0.01);

      const filePath = path.join(this.currentOutputDir, "content.json");
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));

      this.stats.timings.text = (Date.now() - start) / 1000;
      console.log(
        `✅ Content saved to ${filePath}. (${this.stats.timings.text}s)`,
      );
      return content;
    } catch (error) {
      console.error("❌ Error generating text:", error.message);
      return this.fallbackText(topic);
    }
  }

  async fallbackText(topic) {
    return {
      article: `Fallback article about ${topic}.`,
      summary: `Summary of ${topic}.`,
      socialPosts: [`Post about ${topic}`],
    };
  }

  async generateVisuals(topic, summary) {
    const start = Date.now();
    console.log("🎨 Designing visuals (DALL-E 3)...");
    try {
      // Header
      const headerResponse = await this.retry(() =>
        this.openai.images.generate({
          model: "dall-e-3",
          prompt: `A professional cinematic header for an article about ${topic}. Summary: ${summary}. Style: Modern, clean.`,
          n: 1,
          size: "1024x1024", // DALL-E 3 default
        }),
      );
      await this.saveImage(headerResponse.data[0].url, "header.png");
      this.trackOperation("dall-e-3-header", 0.04);

      // Thumbnail
      const thumbResponse = await this.retry(() =>
        this.openai.images.generate({
          model: "dall-e-3",
          prompt: `A vibrant square thumbnail icon for ${topic}. Minimalist.`,
          n: 1,
          size: "1024x1024",
        }),
      );
      await this.saveImage(thumbResponse.data[0].url, "thumbnail.png");
      this.trackOperation("dall-e-3-thumb", 0.04);

      this.stats.timings.visuals = (Date.now() - start) / 1000;
      console.log(`✅ Visuals saved. (${this.stats.timings.visuals}s)`);
    } catch (error) {
      console.error("❌ Error generating visuals:", error.message);
    }
  }

  async saveImage(url, filename) {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(
      path.join(this.currentOutputDir, filename),
      Buffer.from(buffer),
    );
  }

  async generateAudio(text) {
    const start = Date.now();
    console.log("🎙️ Producing narration (OpenAI TTS)...");
    try {
      const mp3 = await this.retry(() =>
        this.openai.audio.speech.create({
          model: "tts-1",
          voice: "alloy",
          input: text,
        }),
      );
      const buffer = Buffer.from(await mp3.arrayBuffer());
      fs.writeFileSync(
        path.join(this.currentOutputDir, "narration.mp3"),
        buffer,
      );

      this.trackOperation("tts-1", 0.015);
      this.stats.timings.audio = (Date.now() - start) / 1000;
      console.log(`✅ Audio saved. (${this.stats.timings.audio}s)`);
    } catch (error) {
      console.error("❌ Error generating audio:", error.message);
    }
  }

  async printReport() {
    const duration = (Date.now() - this.stats.startTime) / 1000;
    console.log("\n--- 📊 AI Content Studio Report ---");
    console.log(`⏱️ Total Duration: ${duration.toFixed(2)}s`);
    console.log(`💰 Total Cost: $${this.stats.totalCost.toFixed(4)}`);
    console.log(`🔄 Operations: ${this.stats.operations}`);
    console.log("⏱️ Timings:", JSON.stringify(this.stats.timings, null, 2));
    console.log(`📂 Output Directory: ${this.currentOutputDir}`);
    console.log("-----------------------------------\n");
  }

  async runStudio(topic) {
    await this.init(topic);
    const content = await this.generateText(topic);
    await this.generateVisuals(topic, content.summary);
    await this.generateAudio(content.summary);
    await this.printReport();
  }
}

// Main Execution
const studio = new AIContentStudio();
const args = process.argv.slice(2);

if (args[0] === "--batch") {
  const topics = args.slice(1);
  console.log(`🚀 Starting batch processing for ${topics.length} topics...`);
  (async () => {
    for (const topic of topics) {
      console.log(`\n--- Processing Topic: ${topic} ---`);
      await studio.runStudio(topic);
    }
    console.log("\n🎉 Batch processing complete!");
  })();
} else {
  const topic = args[0] || "The Future of Artificial General Intelligence";
  studio.runStudio(topic).catch(console.error);
}
