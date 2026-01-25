import mongoose, { Schema, Document } from "mongoose";

// Movie Schema
export interface IMovie extends Document {
  title: string;
  year: number;
  genre: string[];
  rating: number;
  director: string;
  description: string;
  poster?: string;
  plot?: string;
  cast?: string[];
  runtime?: string;
}

const MovieSchema: Schema = new Schema(
  {
    title: { type: String, required: true, index: true },
    year: { type: Number, required: true },
    genre: { type: [String], required: true, index: true },
    rating: { type: Number, required: true, index: true },
    director: { type: String, required: true },
    description: { type: String, required: true },
    poster: { type: String },
    plot: { type: String },
    cast: { type: [String] },
    runtime: { type: String },
  },
  { timestamps: true },
);

// User Schema
export interface IUser extends Document {
  name: string;
  email: string;
  age: number;
  favorite_genre: string[];
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    age: { type: Number, required: true, index: true },
    favorite_genre: { type: [String], required: true },
  },
  { timestamps: true },
);

// Review Schema
export interface IReview extends Document {
  movie_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  date: Date;
}

const ReviewSchema: Schema = new Schema(
  {
    movie_id: { type: Schema.Types.ObjectId, ref: "Movie", required: true },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Joke Schema (for caching)
export interface IJoke extends Document {
  joke_id: string;
  joke: string;
  category: string;
  rating: number; // thumbs up/down count (positive for up, negative for down)
}

const JokeSchema: Schema = new Schema(
  {
    joke_id: { type: String, unique: true },
    joke: { type: String, required: true },
    category: { type: String, default: "general" },
    rating: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Movie =
  mongoose.models.Movie || mongoose.model<IMovie>("Movie", MovieSchema);
export const User =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export const Review =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);
export const Joke =
  mongoose.models.Joke || mongoose.model<IJoke>("Joke", JokeSchema);
