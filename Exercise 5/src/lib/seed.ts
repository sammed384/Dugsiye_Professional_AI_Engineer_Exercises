import mongoose from "mongoose";
import dbConnect from "./db";
import { Movie, User, Review } from "./models";

const movies = [
  {
    title: "Inception",
    year: 2010,
    genre: ["Sci-Fi", "Action"],
    rating: 8.8,
    director: "Christopher Nolan",
    description:
      "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
  },
  {
    title: "The Matrix",
    year: 1999,
    genre: ["Sci-Fi", "Action"],
    rating: 8.7,
    director: "Lana Wachowski, Lilly Wachowski",
    description:
      "A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.",
  },
  {
    title: "Interstellar",
    year: 2014,
    genre: ["Sci-Fi", "Drama"],
    rating: 8.6,
    director: "Christopher Nolan",
    description:
      "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
  },
  {
    title: "Pulp Fiction",
    year: 1994,
    genre: ["Crime", "Drama"],
    rating: 8.9,
    director: "Quentin Tarantino",
    description:
      "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
  },
  {
    title: "The Godfather",
    year: 1972,
    genre: ["Crime", "Drama"],
    rating: 9.2,
    director: "Francis Ford Coppola",
    description:
      "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
  },
];

const users = [
  {
    name: "Alice Johnson",
    email: "alice@example.com",
    age: 28,
    favorite_genre: ["Sci-Fi", "Action"],
  },
  {
    name: "Bob Smith",
    email: "bob@example.com",
    age: 35,
    favorite_genre: ["Crime", "Drama"],
  },
  {
    name: "Charlie Brown",
    email: "charlie@example.com",
    age: 22,
    favorite_genre: ["Sci-Fi", "Drama"],
  },
];

async function seed() {
  await dbConnect();

  console.log("Cleaning database...");
  await Movie.deleteMany({});
  await User.deleteMany({});
  await Review.deleteMany({});

  console.log("Seeding movies...");
  const createdMovies = await Movie.insertMany(movies);

  console.log("Seeding users...");
  const createdUsers = await User.insertMany(users);

  console.log("Seeding reviews...");
  const reviews = [
    {
      movie_id: createdMovies[0]._id,
      user_id: createdUsers[0]._id,
      rating: 9,
      comment: "Mind-bending masterpiece!",
    },
    {
      movie_id: createdMovies[1]._id,
      user_id: createdUsers[0]._id,
      rating: 10,
      comment: "The best sci-fi movie ever.",
    },
    {
      movie_id: createdMovies[4]._id,
      user_id: createdUsers[1]._id,
      rating: 10,
      comment: "A cinematic perfection.",
    },
  ];
  await Review.insertMany(reviews);

  console.log("Database seeded successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Error seeding database:", err);
  process.exit(1);
});
