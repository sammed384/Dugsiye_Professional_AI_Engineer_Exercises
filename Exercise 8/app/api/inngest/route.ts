import { serve } from "inngest/next";
import { inngest } from "../../inngest/client";
import { simpleGreeter } from "../../inngest/functions/simple-greeter";
import { dataProcessor } from "../../inngest/functions/data-processor";
import { emailSender } from "../../inngest/functions/email-sender";
import { approvalWorkflow } from "../../inngest/functions/approval-workflow";
import { apiFetcher } from "../../inngest/functions/api-fetcher";
import { reminder } from "../../inngest/functions/reminder";
import { dailyReport } from "../../inngest/functions/daily-report";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    simpleGreeter,
    dataProcessor,
    emailSender,
    approvalWorkflow,
    apiFetcher,
    reminder,
    dailyReport,
  ],
});
