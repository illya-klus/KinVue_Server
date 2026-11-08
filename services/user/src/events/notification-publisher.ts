import type { NotificationEvent } from "@kinvue/contracts";

/** Same direct exchange the notification service asserts and binds to. */
export const DOMAIN_EXCHANGE = "kinvue.domain";

export const NOTIFICATION_PUBLISHER = Symbol("NOTIFICATION_PUBLISHER");

export interface NotificationPublisher {
  /** Routing key is `event.type`, matching notification queue bindings. */
  publish(event: NotificationEvent): Promise<void>;
}
