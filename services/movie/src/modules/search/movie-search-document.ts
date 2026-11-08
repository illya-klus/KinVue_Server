import type { MovieRow } from "../../database/database.service";

export type MovieSearchDocument = {
  id: string;
  movieId: string;
  title: string;
  description: string;
  genres: string[];
  publicationStatus: "PUBLISHED";
  createdAt: string;
  publishAt: string | null;
};

export function toSearchDocument(movie: MovieRow): MovieSearchDocument {
  const genres = Array.isArray(movie.genres)
    ? movie.genres.filter((g): g is string => typeof g === "string")
    : [];

  return {
    id: movie.id,
    movieId: movie.id,
    title: movie.title,
    description: movie.description,
    genres,
    publicationStatus: "PUBLISHED",
    createdAt: movie.created_at.toISOString(),
    publishAt: movie.publish_at?.toISOString() ?? null,
  };
}
