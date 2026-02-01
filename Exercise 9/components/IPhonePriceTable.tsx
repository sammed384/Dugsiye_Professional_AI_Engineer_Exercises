import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Trophy, DollarSign } from "lucide-react";

interface PriceItem {
  model: string;
  price: number;
  seller: string;
  url: string;
  notes?: string;
}

interface PriceAnalysis {
  cheapestOverall: PriceItem;
  cheapestByModel: Array<{
    category: string;
    model: string;
    price: number;
    seller: string;
    url: string;
  }>;
  allPrices: PriceItem[];
  summary: string;
}

interface IPhonePriceTableProps {
  analysis: PriceAnalysis | null;
}

export default function IPhonePriceTable({ analysis }: IPhonePriceTableProps) {
  if (!analysis) {
    return (
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Price Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">No price data available yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cheapest Overall - Hero Section */}
      <Card className="border-2 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-green-700">
            <Trophy className="w-5 h-5" />
            🏆 Cheapest iPhone Overall
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {analysis.cheapestOverall.model}
              </h3>
              <p className="text-gray-600">{analysis.cheapestOverall.seller}</p>
              {analysis.cheapestOverall.notes && (
                <p className="text-sm text-gray-500 mt-1">
                  {analysis.cheapestOverall.notes}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-green-600">
                ${analysis.cheapestOverall.price.toLocaleString()}
              </p>
              <a
                href={analysis.cheapestOverall.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-2"
              >
                View Deal <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cheapest by Model Category */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Cheapest by Model Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysis.cheapestByModel.map((item, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 rounded-lg border border-gray-100"
              >
                <Badge variant="secondary" className="mb-2">
                  {item.category}
                </Badge>
                <h4 className="font-semibold text-gray-900">{item.model}</h4>
                <p className="text-sm text-gray-600">{item.seller}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-lg font-bold text-green-600">
                    ${item.price.toLocaleString()}
                  </span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Prices Table */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">All Prices Compared</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                    iPhone Model
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                    Seller / Website
                  </th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">
                    Price
                  </th>
                  <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">
                    Link
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {analysis.allPrices.map((item, index) => {
                  const isCheapest =
                    item.price === analysis.cheapestOverall.price &&
                    item.model === analysis.cheapestOverall.model;
                  return (
                    <tr
                      key={index}
                      className={`border-b border-gray-100 ${isCheapest ? "bg-green-50" : ""}`}
                    >
                      <td className="py-3 px-2">
                        <span className="font-medium text-gray-900">
                          {item.model}
                        </span>
                        {isCheapest && (
                          <Badge className="ml-2 bg-green-500">Best Deal</Badge>
                        )}
                      </td>
                      <td className="py-3 px-2 text-gray-600">{item.seller}</td>
                      <td className="py-3 px-2 text-right">
                        <span
                          className={`font-bold ${isCheapest ? "text-green-600" : "text-gray-900"}`}
                        >
                          ${item.price.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="w-4 h-4 mx-auto" />
                        </a>
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-500">
                        {item.notes || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="border-gray-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-blue-800">
            📊 Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">{analysis.summary}</p>
        </CardContent>
      </Card>
    </div>
  );
}
