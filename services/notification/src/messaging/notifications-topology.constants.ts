export const NOTIFIER_DOMAIN_EXCHANGE = "kinvue.domain";
export const NOTIFIER_DLX_EXCHANGE = "kinvue.notifications.dlx";

export const NOTIFIER_MAIN_QUEUE = "notifications.events";
export const NOTIFIER_DLQ_QUEUE = "notifications.events.dlq";

export const NOTIFIER_DLQ_ROUTING_KEY = "notifications.events.dlq";

export const NOTIFIER_ROUTING_KEYS = [
  "ROOM_INVITED",
  "FRIEND_REQUEST_CREATED",
  "FRIEND_REQUEST_ACCEPTED",
] as const;

/** 1 initial delivery + 2 retries, then dead-letter. */
export const NOTIFIER_DELIVERY_LIMIT = 3;
