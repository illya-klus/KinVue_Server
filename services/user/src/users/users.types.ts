export type Preferences = {
  genres: string[];
  languages: string[];
  autoplay: boolean;
};

export type ProfileDoc = {
  _id: string; // auth user id (uuid)
  username: string;
  displayName: string;
  avatarUrl: string | null;
  preferences: Preferences;
  createdAt: Date;
  updatedAt: Date;
};

export type UserProfile = {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  preferences: Preferences;
  createdAt: string;
};

export type UserSearchHit = {
  userId: string;
  username: string;
  displayName: string;
};

export type UserSearchResponse = {
  items: UserSearchHit[];
  nextCursor: string | null;
};

export const DEFAULT_PREFERENCES: Preferences = {
  genres: [],
  languages: [],
  autoplay: true,
};

export function toUserProfile(doc: ProfileDoc): UserProfile {
  return {
    userId: doc._id,
    username: doc.username,
    displayName: doc.displayName,
    avatarUrl: doc.avatarUrl,
    preferences: doc.preferences,
    createdAt: doc.createdAt.toISOString(),
  };
}
