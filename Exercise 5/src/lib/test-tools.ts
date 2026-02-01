import dbConnect from "./db";
import { Movie, User, Joke } from "./models";

async function testTools() {
  await dbConnect();

  console.log("--- Testing Database Queries ---");

  const sciFiMovies = await Movie.find({ genre: "Sci-Fi" }).lean();
  console.log(
    "Sci-Fi Movies:",
    sciFiMovies.map((m) => m.title),
  );

  const usersOver25 = await User.find({ age: { $gt: 25 } }).lean();
  console.log(
    "Users over 25:",
    usersOver25.map((u) => u.name),
  );

  console.log("\n--- Testing OMDb API (Manual check needed) ---");
  console.log("OMDb API Key:", process.env.OMDB_API_KEY || "cc63738b");

  console.log("\n--- Testing Dad Jokes API (Manual check needed) ---");

  console.log("\n--- Testing Local Joke Cache ---");
  const jokes = await Joke.find({}).limit(1).lean();
  console.log("Cached Joke:", jokes[0]?.joke || "No jokes cached yet");

  console.log("\nVerification script finished.");
  process.exit(0);
}

testTools().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
