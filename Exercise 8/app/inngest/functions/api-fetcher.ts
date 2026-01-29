import { inngest } from "../client";

export const apiFetcher = inngest.createFunction(
  { id: "api-fetcher" },
  { event: "api/fetch" },
  async ({ event, step }) => {
    const { url } = event.data;

    // This will automatically retry if it fails
    const data = await step.run("fetch-api", async () => {
      console.log(`Fetching from ${url}...`);

      // Simulate random failures (for demo)
      if (Math.random() > 0.3) {
        throw new Error("API temporarily unavailable");
      }

      return { url, data: "Success!" };
    });

    return data;
  },
);
