import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Circle, Loader2, XCircle } from "lucide-react";

interface IPhoneJobStatusProps {
  status: "running" | "completed" | "failed" | string;
  rawResults?: number;
  extractedPrices?: number;
  hasAnalysis?: boolean;
}

export default function IPhoneJobStatus({
  status,
  rawResults = 0,
  extractedPrices = 0,
  hasAnalysis = false,
}: IPhoneJobStatusProps) {
  const steps = [
    {
      name: "Search",
      description: "Searching for iPhone prices",
      done: rawResults > 0,
      count: rawResults,
    },
    {
      name: "Extract",
      description: "Extracting price data",
      done: extractedPrices > 0,
      count: extractedPrices,
    },
    {
      name: "Analyze",
      description: "Comparing prices",
      done: hasAnalysis,
    },
  ];

  const getStatusIcon = (done: boolean, isActive: boolean) => {
    if (done) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (isActive && status === "running") {
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    }
    return <Circle className="w-5 h-5 text-gray-300" />;
  };

  const getActiveStep = () => {
    for (let i = 0; i < steps.length; i++) {
      if (!steps[i].done) return i;
    }
    return steps.length;
  };

  const activeStep = getActiveStep();

  return (
    <Card className="border-gray-200 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {status === "running" && (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span>Searching for iPhone Prices...</span>
            </>
          )}
          {status === "completed" && (
            <>
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Search Complete</span>
            </>
          )}
          {status === "failed" && (
            <>
              <XCircle className="w-5 h-5 text-red-500" />
              <span>Search Failed</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {steps.map((step, index) => (
            <div key={step.name} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(step.done, index === activeStep)}
                <div>
                  <p
                    className={`text-sm font-medium ${step.done ? "text-green-700" : "text-gray-600"}`}
                  >
                    {step.name}
                  </p>
                  {step.count !== undefined && step.done && (
                    <p className="text-xs text-gray-500">{step.count} found</p>
                  )}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 h-0.5 ${step.done ? "bg-green-300" : "bg-gray-200"}`}
                />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
