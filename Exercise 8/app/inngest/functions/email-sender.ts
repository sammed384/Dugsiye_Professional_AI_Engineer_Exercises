import { inngest } from "../client";

export const emailSender = inngest.createFunction(
  { id: "email-sender" },
  { event: "email/send" },
  async ({ event, step }) => {
    const { emails } = event.data;
    const results = [];

    for (const email of emails) {
      // Send email
      const result = await step.run(`send-email-${email}`, async () => {
        console.log(`Sending email to ${email}...`);
        // Simulate email API call
        await new Promise((resolve) => setTimeout(resolve, 200));
        return { email, status: "sent", timestamp: new Date().toISOString() };
      });

      results.push(result);

      // Wait 2 seconds between emails (rate limiting)
      if (email !== emails[emails.length - 1]) {
        await step.sleep("rate-limit-delay", "2s");
      }
    }

    return { sent: results.length, results };
  },
);
