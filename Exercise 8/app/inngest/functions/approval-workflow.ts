import { inngest } from "../client";

export const approvalWorkflow = inngest.createFunction(
  { id: "approval-workflow" },
  { event: "workflow/start" },
  async ({ event, step }) => {
    const { requestId, action } = event.data;

    // Step 1: Process the request
    const processed = await step.run("process-request", async () => {
      console.log(`Processing request: ${action}`);
      return { requestId, action, status: "pending_approval" };
    });

    // Step 2: Wait for approval (up to 1 hour)
    const approval = await step.waitForEvent("wait-for-approval", {
      event: "workflow/approval",
      timeout: "1h",
      match: "data.requestId", // Match on requestId
    });

    if (!approval) {
      return {
        requestId,
        status: "timeout",
        message: "Approval not received within 1 hour",
      };
    }

    // Step 3: Execute approved action
    const result = await step.run("execute-action", async () => {
      if (approval.data.approved) {
        console.log(`Executing approved action: ${action}`);
        return { requestId, status: "completed", action };
      } else {
        return { requestId, status: "rejected", reason: approval.data.reason };
      }
    });

    return result;
  },
);
