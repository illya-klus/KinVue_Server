/**
 * KIN-269 — transcode queue depth probe (fixture-oriented).
 * Requires RabbitMQ management or metrics endpoint in future; for now documents operator steps.
 */
console.log(
  JSON.stringify(
    {
      task: "Enqueue N fixture transcode jobs and observe queue depth",
      steps: [
        "pnpm infra:up",
        "Publish a movie and complete a small fixture upload",
        "Watch media.transcode queue depth in RabbitMQ UI :15672",
        "With one worker, jobs should drain serially",
      ],
      fixtureOnly: true,
      notTwentyGbFiles: true,
    },
    null,
    2,
  ),
);
