"use client";

import { useState } from "react";

const functions = [
  {
    id: "simple-greeter",
    name: "Simple Greeter",
    event: "greet/user",
    description: "A single-step function that says hello.",
    payload: { name: "Sam" },
  },
  {
    id: "data-processor",
    name: "Data Processor",
    event: "data/process",
    description:
      "A multi-step function that fetches, transforms, and saves data.",
    payload: { source: "api" },
  },
  {
    id: "email-sender",
    name: "Email Sender",
    event: "email/send",
    description: "Sends emails with a 2-second delay between each.",
    payload: {
      emails: ["sam@gmail.com", "bob@gmail.com", "charlie@gmail.com"],
    },
  },
  {
    id: "approval-workflow",
    name: "Approval Workflow",
    event: "workflow/start",
    description: "Starts a workflow that waits for an approval event.",
    payload: { requestId: "req-123", action: "deploy-to-production" },
  },
  {
    id: "api-fetcher",
    name: "API Fetcher",
    event: "api/fetch",
    description: "Fetches data from an API with automatic retries on failure.",
    payload: { url: "https://api.example.com/data" },
  },
  {
    id: "reminder",
    name: "Scheduled Reminder",
    event: "reminder/schedule",
    description: "Schedules a reminder after a specified delay.",
    payload: { message: "Don't forget the meeting!", delayMinutes: 1 },
  },
];

export default function Home() {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});

  const triggerEvent = async (func: (typeof functions)[0]) => {
    setLoading(func.id);
    try {
      const res = await fetch("/api/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: func.event, data: func.payload }),
      });
      const data = await res.json();
      setResults((prev) => ({
        ...prev,
        [func.id]: data.message || data.error,
      }));
    } catch (error: any) {
      setResults((prev) => ({ ...prev, [func.id]: error.message }));
    } finally {
      setLoading(null);
    }
  };

  const sendApproval = async () => {
    setLoading("approval");
    try {
      const res = await fetch("/api/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "workflow/approval",
          data: { requestId: "req-123", approved: true },
        }),
      });
      const data = await res.json();
      setResults((prev) => ({ ...prev, approval: data.message || data.error }));
    } catch (error: any) {
      setResults((prev) => ({ ...prev, approval: error.message }));
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-8 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-4">
            Inngest Agent Dashboard
          </h1>
          <p className="text-gray-400 text-lg">
            Trigger and monitor background AI agents with durable workflows.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {functions.map((func) => (
            <div
              key={func.id}
              className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6 hover:border-purple-500 transition-all duration-300 group"
            >
              <h2 className="text-xl font-semibold mb-2 group-hover:text-purple-400 transition-colors">
                {func.name}
              </h2>
              <p className="text-gray-400 text-sm mb-6 h-12">
                {func.description}
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => triggerEvent(func)}
                  disabled={loading === func.id}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === func.id ? "Triggering..." : "Trigger Event"}
                </button>

                {results[func.id] && (
                  <div className="p-3 bg-black/50 rounded-lg border border-gray-800 text-xs font-mono text-green-400 break-all">
                    {results[func.id]}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Special Approval Button */}
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6 hover:border-blue-500 transition-all duration-300 group">
            <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-400 transition-colors">
              Approve Workflow
            </h2>
            <p className="text-gray-400 text-sm mb-6 h-12">
              Send the approval event for the Approval Workflow (req-123).
            </p>

            <div className="space-y-4">
              <button
                onClick={sendApproval}
                disabled={loading === "approval"}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === "approval" ? "Sending..." : "Send Approval"}
              </button>

              {results.approval && (
                <div className="p-3 bg-black/50 rounded-lg border border-gray-800 text-xs font-mono text-blue-400 break-all">
                  {results.approval}
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="mt-16 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>Exercise 8: Next.js + MongoDB + Inngest</p>
          <p className="mt-2">
            Open{" "}
            <code className="bg-gray-800 px-1 rounded text-gray-300">
              http://localhost:8288
            </code>{" "}
            to see the Inngest Dashboard.
          </p>
        </footer>
      </div>
    </main>
  );
}
