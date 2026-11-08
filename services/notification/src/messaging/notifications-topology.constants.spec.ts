import {
  NOTIFIER_DELIVERY_LIMIT,
  NOTIFIER_ROUTING_KEYS,
} from "./notifications-topology.constants";

describe("notifications topology", () => {
  it("binds the three domain routing keys", () => {
    expect(NOTIFIER_ROUTING_KEYS).toEqual([
      "ROOM_INVITED",
      "FRIEND_REQUEST_CREATED",
      "FRIEND_REQUEST_ACCEPTED",
    ]);
  });

  it("allows two retries before dead-letter", () => {
    expect(NOTIFIER_DELIVERY_LIMIT).toBe(3);
  });
});
