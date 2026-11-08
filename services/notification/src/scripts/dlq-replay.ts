import amqp from "amqplib";
import {
  NOTIFIER_DLQ_QUEUE,
  NOTIFIER_DLQ_ROUTING_KEY,
  NOTIFIER_DLX_EXCHANGE,
  NOTIFIER_DOMAIN_EXCHANGE,
} from "../messaging/notifications-topology.constants";

type Options = {
  messageId?: string;
  all: boolean;
};

function parseArgs(argv: string[]): Options {
  const all = argv.includes("--all");
  const messageIdIndex = argv.indexOf("--message-id");
  const messageId =
    messageIdIndex >= 0 ? argv[messageIdIndex + 1]?.trim() : undefined;
  if (!all && !messageId) {
    throw new Error(
      "Pass --message-id <id> for one message or --all to replay the entire DLQ",
    );
  }
  return { all, messageId };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const url = process.env.RABBITMQ_URL;
  if (!url) {
    throw new Error("RABBITMQ_URL is required");
  }

  const connection = await amqp.connect(url);
  const channel = await connection.createChannel();

  const replayed: string[] = [];
  while (true) {
    const message = await channel.get(NOTIFIER_DLQ_QUEUE, { noAck: false });
    if (!message) {
      break;
    }

    const messageId =
      message.properties.messageId ?? message.fields.deliveryTag;
    const idLabel = String(messageId);
    const shouldReplay = options.all || options.messageId === idLabel;

    if (!shouldReplay) {
      channel.nack(message, false, true);
      continue;
    }

    const body = message.content;
    const routingKey =
      (message.properties.headers?.["x-routing-key"] as string | undefined) ??
      (message.fields as { routingKey?: string }).routingKey ??
      "ROOM_INVITED";

    channel.publish(NOTIFIER_DOMAIN_EXCHANGE, routingKey, body, {
      persistent: true,
      messageId: message.properties.messageId,
      headers: message.properties.headers,
    });

    channel.ack(message);
    replayed.push(idLabel);
    process.stdout.write(`replayed ${idLabel} via ${routingKey}\n`);

    if (!options.all) {
      break;
    }
  }

  await channel.close();
  await connection.close();

  if (replayed.length === 0) {
    throw new Error("No matching DLQ message found");
  }
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : "dlq replay failed"}\n`,
  );
  process.exitCode = 1;
});
