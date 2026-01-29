import { inngest } from "../client";

export const simpleGreeter = inngest.createFunction(
  { id: "simple-greeter" },
  { event: "greet/user" },
  async ({ event, step }) => {
    // Just ONE step - perfect for learning!
    const result = await step.run("say-hello", async () => {
      const { name } = event.data;
      console.log(`Hello, ${name}!`);
      return {
        message: `Hello, ${name}!`,
        timestamp: new Date().toISOString(),
      };
    });

    return result;
  },
);
