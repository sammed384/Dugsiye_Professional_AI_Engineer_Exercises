import { inngest } from "../client";

export const reminder = inngest.createFunction(
  { id: "reminder" },
  { event: "reminder/schedule" },
  async ({ event, step }) => {
    const { message, delayMinutes } = event.data;

    // Wait for the specified delay
    await step.sleep("wait-for-reminder", `${delayMinutes}m`);

    // Send reminder
    const sent = await step.run("send-reminder", async () => {
      console.log(`🔔 Reminder: ${message}`);
      return {
        message,
        sentAt: new Date().toISOString(),
        originalDelay: delayMinutes,
      };
    });

    return sent;
  },
);
