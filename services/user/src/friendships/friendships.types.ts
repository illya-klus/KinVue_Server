export type FriendshipStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export type FriendshipDoc = {
  _id: string; // friendshipId (uuid), used as friendRequest id
  pairKey: string; // sorted "<idA>:<idB>", unique: one record per user pair
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type FriendRequestRow = {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: FriendshipStatus;
  createdAt: string;
  otherUser?: { userId: string; username: string; displayName: string };
};

export type FriendRow = {
  userId: string;
  username: string;
  displayName: string;
};

export function pairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

export function toRequestRow(doc: FriendshipDoc): FriendRequestRow {
  return {
    id: doc._id,
    fromUserId: doc.requesterId,
    toUserId: doc.addresseeId,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
  };
}
