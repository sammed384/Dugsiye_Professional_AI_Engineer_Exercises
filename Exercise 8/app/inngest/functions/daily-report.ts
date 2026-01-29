import { inngest } from "../client";

export const dailyReport = inngest.createFunction(
  { id: "daily-report" },
  // Run every minute (for testing - change to "0 9 * * *" for 9 AM daily)
  { cron: "*/1 * * * *" }, // Every minute
  async ({ step }) => {
    const report = await step.run("generate-report", async () => {
      const timestamp = new Date().toISOString();
      console.log(`📊 Generating daily report at ${timestamp}`);

      // Simulate report generation
      return {
        date: new Date().toDateString(),
        metrics: {
          users: Math.floor(Math.random() * 1000),
          revenue: Math.floor(Math.random() * 10000),
        },
        generatedAt: timestamp,
      };
    });

    return report;
  },
);
