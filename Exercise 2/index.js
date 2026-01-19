import Replicate from "replicate";
import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import "dotenv/config";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Simplified pricing for Replicate (approximate per run)
const PRICING = {
  "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc": 0.0023, // Approximate cost per generation
  "meta/meta-llama-3-8b-instruct": 0.0001, // Approximate cost per enhancement
};

/**
 * Helper to run Replicate with retry on rate limits
 */
async function runWithRetry(model, options, retries = 5) {
  try {
    return await replicate.run(model, options);
  } catch (error) {
    const isRateLimit =
      error.status === 429 || (error.message && error.message.includes("429"));

    if (isRateLimit && retries > 0) {
      // Try to parse retry_after from error message if not present
      let retryAfter = error.retry_after;
      if (!retryAfter && error.message) {
        const match = error.message.match(/retry_after":(\d+)/);
        if (match) retryAfter = parseInt(match[1]);
      }
      retryAfter = retryAfter || 10; // Default to 10s if unknown

      console.log(`⚠️ Rate limit hit. Waiting ${retryAfter}s before retry...`);
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      return runWithRetry(model, options, retries - 1);
    }
    throw error;
  }
}

async function enhancePrompt(theme) {
  try {
    console.log(`\nEnhancing prompt for theme: "${theme}"...`);
    const input = {
      prompt: `You are an expert prompt engineer for SDXL. Create a detailed, descriptive prompt based on the user's theme. The prompt should be vivid and suitable for high-quality image generation. Return ONLY the prompt text.\n\nTheme: ${theme}\nPrompt:`,
      max_new_tokens: 200,
    };

    const output = await runWithRetry("meta/meta-llama-3-8b-instruct", {
      input,
    });
    const enhancedPrompt = Array.isArray(output)
      ? output.join("").trim()
      : output.trim();
    return enhancedPrompt;
  } catch (error) {
    console.error("Error enhancing prompt:", error.message);
    return theme; // Fallback to original theme
  }
}

async function generateImage(model, prompt, size) {
  try {
    const [width, height] = size.split("x").map(Number);
    const input = {
      prompt: prompt,
      width: width,
      height: height,
      refine: "expert_ensemble_refiner",
      scheduler: "K_EULER",
      num_outputs: 1,
      guidance_scale: 7.5,
      apply_watermark: false,
      high_noise_frac: 0.8,
      num_inference_steps: 50,
    };

    const output = await runWithRetry(model, { input });

    // Replicate returns an array of URLs for SDXL
    const imageUrl = output[0];
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return {
      success: true,
      data: buffer.toString("base64"),
      revised_prompt: prompt,
    };
  } catch (error) {
    console.error(`Error generating image (${model}, ${size}):`, error.message);
    return { success: false, error: error.message };
  }
}

function calculateCost(model) {
  return PRICING[model] || 0;
}

async function main() {
  console.log("Welcome to the Smart Image Generator (Replicate Edition)!");

  const { theme } = await inquirer.prompt([
    {
      type: "input",
      name: "theme",
      message: "Enter a theme for your images (e.g., 'cyberpunk cityscape'):",
      validate: (input) => input.length > 0 || "Please enter a theme.",
    },
  ]);

  const enhancedPrompt = await enhancePrompt(theme);
  console.log(`Enhanced Prompt: ${enhancedPrompt}\n`);

  const date = new Date().toISOString().split("T")[0];
  const baseDir = path.join("generated_images", date);
  const imagesDir = path.join(baseDir, "images");

  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  const configurations = [
    {
      model:
        "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
      size: "1024x1024",
    },
    {
      model:
        "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
      size: "1280x720",
    }, // Landscape
    {
      model:
        "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
      size: "720x1280",
    }, // Portrait
  ];

  const results = [];
  let totalCost = 0;

  // Add cost for prompt enhancement
  totalCost += calculateCost("meta/meta-llama-3-8b-instruct");

  console.log("Starting generation loop...");

  for (const config of configurations) {
    console.log(`\nGenerating: ${config.model} | ${config.size}...`);

    // Add a delay between requests to stay within the 6 requests/minute limit
    console.log("⏳ Waiting 10s to avoid rate limits...");
    await new Promise((resolve) => setTimeout(resolve, 10000));

    const cost = calculateCost(config.model);
    totalCost += cost;

    const result = await generateImage(
      config.model,
      enhancedPrompt,
      config.size,
    );

    const resultEntry = {
      params: { ...config, prompt: enhancedPrompt },
      cost: cost,
      success: result.success,
    };

    if (result.success) {
      const safeTheme = theme.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const filename = `${safeTheme}-${config.size}-${Date.now()}.png`;
      const filePath = path.join(imagesDir, filename);

      fs.writeFileSync(filePath, Buffer.from(result.data, "base64"));
      resultEntry.filename = `images/${filename}`;
      resultEntry.revised_prompt = result.revised_prompt;
      console.log(`Saved: ${filePath}`);
    } else {
      resultEntry.error = result.error;
    }

    results.push(resultEntry);
  }

  // Save Metadata
  fs.writeFileSync(
    path.join(baseDir, "metadata.json"),
    JSON.stringify({ theme, enhancedPrompt, totalCost, results }, null, 2),
  );

  console.log(`\nGeneration Complete!`);
  console.log(`Total Estimated Cost: $${totalCost.toFixed(4)}`);
  console.log(`Metadata saved to: ${path.join(baseDir, "metadata.json")}`);
}

main().catch(console.error);
