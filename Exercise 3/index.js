import Replicate from "replicate";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Ensure assets folder exists
const assetsDir = path.join(__dirname, "assets");
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Multi-voice conversation script with different speakers
// Using the default male voice sample from Replicate
const speakerVoice =
  "https://replicate.delivery/pbxt/Jt79w0xsT64R1JsiJ0LQRL8UcWspg5J4RFrU6YwEKpOT1ukS/male.wav";

const conversation = [
  {
    speaker: "Alex",
    emotion: "excited",
    text: "Hey! You won't believe what just happened! I got the job at Google!",
    filename: "01_alex_excited.wav",
  },
  {
    speaker: "Sam",
    emotion: "surprised_happy",
    text: "Oh my goodness, Alex! That's absolutely incredible news! I knew you could do it!",
    filename: "02_sam_surprised.wav",
  },
  {
    speaker: "Alex",
    emotion: "nervous",
    text: "Thanks! But honestly, I'm a bit nervous. It's a huge responsibility, you know?",
    filename: "03_alex_nervous.wav",
  },
  {
    speaker: "Sam",
    emotion: "reassuring",
    text: "Don't worry about it. You've worked so hard for this. You're going to do amazing things there.",
    filename: "04_sam_reassuring.wav",
  },
  {
    speaker: "Alex",
    emotion: "grateful",
    text: "You're right. Thanks for always believing in me. It really means a lot.",
    filename: "05_alex_grateful.wav",
  },
  {
    speaker: "Sam",
    emotion: "cheerful",
    text: "That's what friends are for! Now, let's go celebrate! Dinner is on me tonight!",
    filename: "06_sam_cheerful.wav",
  },
  {
    speaker: "Alex",
    emotion: "happy",
    text: "You're the best! Let's do it! I'm thinking pizza and ice cream!",
    filename: "07_alex_happy.wav",
  },
  {
    speaker: "Sam",
    emotion: "laughing",
    text: "Ha ha! Classic Alex! Pizza and ice cream it is then!",
    filename: "08_sam_laughing.wav",
  },
];

async function generateSpeech(dialogLine) {
  const { speaker, emotion, text, filename } = dialogLine;

  console.log(`\n🎭 [${speaker}] (${emotion})`);
  console.log(`   💬 "${text}"`);

  try {
    // Using Coqui XTTS-v2 model for text-to-speech
    const output = await replicate.run(
      "lucataco/xtts-v2:684bc3855b37866c0c65add2ff39c78f3dea3f4ff103a436465326e0f438d55e",
      {
        input: {
          text: text,
          speaker: speakerVoice,
          language: "en",
          cleanup_voice: true,
        },
      },
    );

    // Download and save the audio file
    if (output) {
      const response = await fetch(output);
      const buffer = await response.arrayBuffer();
      const outputPath = path.join(assetsDir, filename);
      fs.writeFileSync(outputPath, Buffer.from(buffer));
      console.log(`   ✅ Saved: ${filename}`);
      return outputPath;
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    throw error;
  }
}

async function main() {
  console.log("🎬 Multi-Voice Conversation Generator");
  console.log("=====================================");
  console.log("Using Replicate XTTS-v2 for Text-to-Speech\n");

  console.log("📝 Conversation Script:");
  console.log("-".repeat(40));

  // Preview the conversation
  conversation.forEach((line) => {
    console.log(`${line.speaker} (${line.emotion}): "${line.text}"`);
  });

  console.log("\n" + "=".repeat(50));
  console.log("🎙️  Generating audio files...");
  console.log("=".repeat(50));

  // Generate each line of dialogue
  for (const dialogLine of conversation) {
    await generateSpeech(dialogLine);
  }

  console.log("\n" + "=".repeat(50));
  console.log("✨ Conversation generation complete!");
  console.log(
    `📁 All ${conversation.length} audio files saved in: ${assetsDir}`,
  );
  console.log("\n📋 Generated files:");
  conversation.forEach((line) => {
    console.log(`   - ${line.filename} (${line.speaker} - ${line.emotion})`);
  });
}

main().catch(console.error);
