"use client";

import ArticleCard from "@/components/ArticleCard";
import JobStatus from "@/components/JobStatus";
import PosterCard from "@/components/PosterCard";
import PostsCard from "@/components/PostsCard";
import SearchInput from "@/components/SearchInput";
import SentimentCard from "@/components/SentimentCard";
import IPhoneSearchPanel from "@/components/IPhoneSearchPanel";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Newspaper, Smartphone } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"news" | "iphone">("news");
  const [input, setInput] = useState("");
  const [limit, setLimit] = useState(1);
  const [runId, setRunId] = useState<string | null>(null);

  const { data: result, isLoading } = useQuery({
    queryKey: ["results", runId],
    queryFn: async () => {
      const response = await fetch(`/api/results/${runId}`);
      return response.json();
    },
    enabled: !!runId,
    refetchInterval: (query) => {
      // stop polling when completed or failed
      const data = query.state.data;
      if (data?.status === "completed" || data?.status === "failed") {
        return false;
      }
      return 2000;
    },
  });

  const handleRun = async () => {
    if (!input.trim()) {
      alert("Please enter a search query");
      return;
    }

    try {
      const res = await fetch("/api/run-agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, limit }),
      });

      const data = await res.json();
      setRunId(data.runId);
      console.log("Run ID:", data.runId);
    } catch (error) {
      console.error("Error running agents:", error);
      alert("Failed to run agents. Please try again.");
    }
  };

  const state = result?.state || null;

  console.log(state);

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            AI Multi-Agent System
          </h1>
          <p className="text-gray-600 mt-1">
            Intelligent agents for news analysis and price comparison
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab("news")}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === "news"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Newspaper className="w-4 h-4" />
            News Agents
          </button>
          <button
            onClick={() => setActiveTab("iphone")}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === "iphone"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            iPhone Price Search
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "news" && (
          <>
            {/* Input Form */}
            <SearchInput
              input={input}
              limit={limit}
              onInputChange={setInput}
              onLimitChange={setLimit}
              onRun={handleRun}
              isLoading={isLoading}
            />

            {/* Result Status */}
            {result && (
              <>
                <JobStatus
                  status={result.status}
                  articles={state.articles?.length}
                  sentiments={state.sentiments?.length}
                  posts={state.posts?.length}
                  posters={state.posters?.length}
                  approved={state.approved}
                />

                {/* Data Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  <ArticleCard articles={state.articles || []} />
                  <SentimentCard sentiments={state.sentiments || []} />
                  <PostsCard posts={state.posts || []} />
                  <PosterCard posters={state.posters || []} />
                </div>
              </>
            )}
          </>
        )}

        {activeTab === "iphone" && <IPhoneSearchPanel />}
      </div>
    </main>
  );
}
