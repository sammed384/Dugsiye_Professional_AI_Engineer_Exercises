import { openai } from "@ai-sdk/openai";
import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool,
  generateObject,
} from "ai";
import { z } from "zod";
import dbConnect from "@/lib/db";
import { Movie, User, Review, Joke } from "@/lib/models";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    messages: convertToModelMessages(messages),
    tools: {
      databaseChat: tool({
        description:
          "Query the movie database using natural language. Supports movies, users, and reviews.",
        inputSchema: z.object({
          query: z
            .string()
            .describe(
              "The natural language query to convert to a MongoDB operation",
            ),
        }),
        execute: async ({ query }) => {
          await dbConnect();

          // Use LLM to convert natural language to MongoDB query
          const { object: mongoQuery } = await generateObject({
            model: openai("gpt-4o"),
            schema: z.object({
              collection: z.enum(["Movie", "User", "Review"]),
              operation: z.enum(["find", "countDocuments", "aggregate"]),
              filter: z.any().optional(),
              projection: z.any().optional(),
              sort: z.any().optional(),
              limit: z.number().optional(),
              pipeline: z.array(z.any()).optional(),
            }),
            prompt: `Convert the following natural language query into a MongoDB operation for a movie database.
            Schemas:
            - Movie: title, year, genre (array), rating, director, description
            - User: name, email, age, favorite_genre (array)
            - Review: movie_id, user_id, rating, comment, date
            
            Query: "${query}"`,
          });

          let results;
          const Model =
            mongoQuery.collection === "Movie"
              ? Movie
              : mongoQuery.collection === "User"
                ? User
                : Review;

          if (mongoQuery.operation === "find") {
            results = await Model.find(mongoQuery.filter || {})
              .select(mongoQuery.projection)
              .sort(mongoQuery.sort)
              .limit(mongoQuery.limit || 10)
              .lean();
          } else if (mongoQuery.operation === "countDocuments") {
            results = {
              count: await Model.countDocuments(mongoQuery.filter || {}),
            };
          } else if (mongoQuery.operation === "aggregate") {
            results = await Model.aggregate(mongoQuery.pipeline || []);
          }

          return {
            query,
            mongoQuery,
            results,
          };
        },
      }),
      movieDatabase: tool({
        description: "Fetch detailed movie information from OMDb API.",
        inputSchema: z.object({
          title: z.string().describe("The title of the movie to search for"),
          year: z
            .string()
            .optional()
            .describe("The year of the movie (optional)"),
        }),
        execute: async ({ title, year }) => {
          const apiKey = process.env.OMDB_API_KEY || "cc63738b"; // Using a placeholder or common key if available
          const url = `http://www.omdbapi.com/?t=${encodeURIComponent(title)}${year ? `&y=${year}` : ""}&apikey=${apiKey}`;

          try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.Response === "False") {
              return { error: data.Error || "Movie not found" };
            }

            // Cache in database
            await dbConnect();
            await Movie.findOneAndUpdate(
              { title: data.Title, year: parseInt(data.Year) },
              {
                title: data.Title,
                year: parseInt(data.Year),
                genre: data.Genre.split(", "),
                rating: parseFloat(data.imdbRating) || 0,
                director: data.Director,
                description: data.Plot,
                poster: data.Poster,
                plot: data.Plot,
                cast: data.Actors.split(", "),
                runtime: data.Runtime,
              },
              { upsert: true },
            );

            return data;
          } catch (error) {
            return { error: "Failed to fetch movie data" };
          }
        },
      }),
      dadJokes: tool({
        description: "Get a random dad joke or search for jokes.",
        inputSchema: z.object({
          keyword: z
            .string()
            .optional()
            .describe("Keyword to search for jokes (optional)"),
        }),
        execute: async ({ keyword }) => {
          const url = keyword
            ? `https://icanhazdadjoke.com/search?term=${encodeURIComponent(keyword)}`
            : "https://icanhazdadjoke.com/";

          try {
            const response = await fetch(url, {
              headers: { Accept: "application/json" },
            });
            const data = await response.json();

            let joke;
            if (keyword) {
              if (data.results && data.results.length > 0) {
                joke =
                  data.results[Math.floor(Math.random() * data.results.length)];
              } else {
                return { error: "No jokes found for that keyword" };
              }
            } else {
              joke = data;
            }

            // Cache in database
            await dbConnect();
            await Joke.findOneAndUpdate(
              { joke_id: joke.id },
              { joke_id: joke.id, joke: joke.joke },
              { upsert: true },
            );

            return joke;
          } catch (error) {
            // Fallback to local database
            await dbConnect();
            const localJokes = await Joke.find({});
            if (localJokes.length > 0) {
              const randomJoke =
                localJokes[Math.floor(Math.random() * localJokes.length)];
              return {
                joke: randomJoke.joke,
                id: randomJoke.joke_id,
                note: "Fetched from local cache",
              };
            }
            return {
              error: "Failed to fetch joke and no local cache available",
            };
          }
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
