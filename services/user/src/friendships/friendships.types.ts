export type FriendshipStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export type FriendshipDoc = {
  _id: string; // friendshipId (uuid), used as friendRequest id
  user1Id: string;
  user2Id: string;
  requestedBy: string;
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

export function normalizeFriendshipPair(a: string, b: string) {
  return a < b ? { user1Id: a, user2Id: b } : { user1Id: b, user2Id: a };
}

export function toRequestRow(doc: FriendshipDoc): FriendRequestRow {
  return {
    id: doc._id,
    fromUserId: doc.requestedBy,
    toUserId: doc.addresseeId,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
  };
}
