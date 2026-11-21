import type { MovieRow } from "../../database/database.service";
export function movieView(movie: MovieRow) {
  return {
    movieId: movie.id,
    title: movie.title,
    description: movie.description,
    genres: movie.genres,
    durationSeconds: movie.duration_seconds ?? null,
    posterKey: movie.poster_key ?? null,
    publicationStatus: movie.status,
    mediaStatus: movie.media_status,
    publishAt: movie.publish_at?.toISOString() ?? null,
    createdAt: movie.created_at.toISOString(),
    updatedAt: movie.updated_at.toISOString(),
  };
}
