"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";

export default function ChatWithTools() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, isLoading } = useChat({
    api: "/api/chat-tools",
    maxSteps: 5,
  });

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="text-center py-8 bg-white border-b shadow-sm">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
          AI Movie & Joke Assistant
        </h1>
        <p className="text-lg text-gray-600">
          Query the database, search movies, or get a laugh!
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-3xl px-5 py-4 rounded-2xl shadow-sm ${
                  message.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-900 border border-gray-200"
                }`}
              >
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case "text":
                      return (
                        <div
                          key={i}
                          className="whitespace-pre-wrap leading-relaxed"
                        >
                          {part.text}
                        </div>
                      );

                    case "tool-databaseChat":
                      return (
                        <div
                          key={i}
                          className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl overflow-x-auto"
                        >
                          <div className="text-sm font-bold text-blue-800 mb-2 flex items-center">
                            <span className="mr-2">🗄️</span> Database Query:{" "}
                            {part.args.query}
                          </div>
                          {part.result && part.result.results && (
                            <table className="min-w-full text-xs text-left text-blue-900">
                              <thead>
                                <tr className="border-b border-blue-200">
                                  {Object.keys(
                                    Array.isArray(part.result.results)
                                      ? part.result.results[0] || {}
                                      : part.result.results,
                                  ).map((key) => (
                                    <th
                                      key={key}
                                      className="px-2 py-1 font-semibold uppercase"
                                    >
                                      {key}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {(Array.isArray(part.result.results)
                                  ? part.result.results
                                  : [part.result.results]
                                ).map((row: any, idx: number) => (
                                  <tr
                                    key={idx}
                                    className="border-b border-blue-100 last:border-0"
                                  >
                                    {Object.values(row).map(
                                      (val: any, vIdx) => (
                                        <td
                                          key={vIdx}
                                          className="px-2 py-1 truncate max-w-[200px]"
                                        >
                                          {typeof val === "object"
                                            ? JSON.stringify(val)
                                            : String(val)}
                                        </td>
                                      ),
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      );

                    case "tool-movieDatabase":
                      return (
                        <div
                          key={i}
                          className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl"
                        >
                          <div className="text-sm font-bold text-rose-800 mb-3 flex items-center">
                            <span className="mr-2">🎬</span> Movie Details:{" "}
                            {part.args.title}
                          </div>
                          {part.result && !part.result.error ? (
                            <div className="flex flex-col md:flex-row gap-4">
                              {part.result.Poster &&
                                part.result.Poster !== "N/A" && (
                                  <img
                                    src={part.result.Poster}
                                    alt={part.result.Title}
                                    className="w-32 h-48 object-cover rounded-lg shadow-md"
                                  />
                                )}
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-rose-900">
                                  {part.result.Title} ({part.result.Year})
                                </h3>
                                <p className="text-sm text-rose-700 mt-1">
                                  <strong>Director:</strong>{" "}
                                  {part.result.Director}
                                </p>
                                <p className="text-sm text-rose-700">
                                  <strong>Genre:</strong> {part.result.Genre}
                                </p>
                                <p className="text-sm text-rose-700">
                                  <strong>Rating:</strong> ⭐{" "}
                                  {part.result.imdbRating}
                                </p>
                                <p className="text-sm text-gray-700 mt-2 italic">
                                  {part.result.Plot}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-rose-600 text-sm">
                              {part.result?.error || "Loading..."}
                            </div>
                          )}
                        </div>
                      );

                    case "tool-dadJokes":
                      return (
                        <div
                          key={i}
                          className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-center"
                        >
                          <div className="text-sm font-bold text-amber-800 mb-2 flex justify-center items-center">
                            <span className="mr-2">😄</span> Dad Joke
                          </div>
                          {part.result && !part.result.error ? (
                            <div>
                              <p className="text-xl font-medium text-amber-900 italic">
                                "{part.result.joke}"
                              </p>
                              <div className="mt-3 flex justify-center gap-4">
                                <button className="p-1 hover:bg-amber-200 rounded transition-colors">
                                  👍
                                </button>
                                <button className="p-1 hover:bg-amber-200 rounded transition-colors">
                                  👎
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-amber-600 text-sm">
                              {part.result?.error || "Loading..."}
                            </div>
                          )}
                        </div>
                      );
                  }
                })}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-2 rounded-full text-sm text-gray-500 animate-pulse">
                AI is thinking...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Input at Bottom */}
      <div className="border-t bg-white p-6 shadow-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage({ text: input });
            setInput("");
          }}
          className="max-w-5xl mx-auto"
        >
          <div className="flex space-x-3">
            <input
              className="flex-1 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm"
              value={input}
              placeholder="Ask about movies, users, or tell me a joke..."
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:bg-gray-400 transition-all shadow-md"
            >
              Send
            </button>
          </div>
        </form>
      </div>

      {/* Example prompts */}
      <div className="border-t bg-gray-100 p-4">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">
            Try these prompts:
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              "Show me all sci-fi movies",
              "Find users over 25",
              "Tell me about the movie Inception",
              "Tell me a programming joke",
              "Get movies with rating above 8.5",
            ].map((prompt) => (
              <button
                key={prompt}
                onClick={() => setInput(prompt)}
                className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-full hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
