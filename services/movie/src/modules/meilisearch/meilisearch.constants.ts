export const MOVIES_INDEX = "movies";

export const MEILI_SEARCHABLE = ["title", "description", "genres"] as const;
export const MEILI_FILTERABLE = ["genres", "publicationStatus"] as const;
export const MEILI_SORTABLE = ["title", "createdAt", "publishAt"] as const;
