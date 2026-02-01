"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Smartphone, Search, Loader2 } from "lucide-react";
import IPhonePriceTable from "./IPhonePriceTable";
import IPhoneJobStatus from "./IPhoneJobStatus";

export default function IPhoneSearchPanel() {
  const [runId, setRunId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const { data: result, isLoading } = useQuery({
    queryKey: ["iphone-results", runId],
    queryFn: async () => {
      const response = await fetch(`/api/iphone-results/${runId}`);
      return response.json();
    },
    enabled: !!runId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === "completed" || data?.status === "failed") {
        return false;
      }
      return 2000;
    },
  });

  const handleSearch = async () => {
    setIsStarting(true);
    try {
      const res = await fetch("/api/run-iphone-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setRunId(data.runId);
      console.log("iPhone Search Started - RunId:", data.runId);
    } catch (error) {
      console.error("Error starting iPhone search:", error);
      alert("Failed to start iPhone price search. Please try again.");
    } finally {
      setIsStarting(false);
    }
  };

  const state = result?.state || {};

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-3">
            <Smartphone className="w-7 h-7 text-blue-600" />
            iPhone Price Search Agent
          </CardTitle>
          <CardDescription className="text-gray-600">
            Our AI agents search multiple retailers to find the cheapest iPhone
            prices online.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleSearch}
            disabled={isStarting || (isLoading && result?.status === "running")}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isStarting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting Search...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Find Cheapest iPhone Prices
              </>
            )}
          </Button>
          <p className="text-sm text-gray-500 mt-3">
            Searches iPhone 14, iPhone 15, iPhone 15 Pro, iPhone 15 Pro Max, and
            iPhone SE prices.
          </p>
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <>
          <IPhoneJobStatus
            status={result.status}
            rawResults={state.rawSearchResults?.length}
            extractedPrices={state.extractedPrices?.length}
            hasAnalysis={!!state.priceAnalysis}
          />

          <IPhonePriceTable analysis={state.priceAnalysis} />
        </>
      )}
    </div>
  );
}
