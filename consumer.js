const amqp = require("amqplib");

async function startConsumer() {
  try {
    const connection = await amqp.connect({
      hostname: "localhost",
      port: 5672,
    });
    const channel = await connection.createChannel();

    const queue = "task_queue";
    await channel.assertQueue(queue, { durable: true });

    // Fair dispatch — only send 1 job at a time to each worker
    channel.prefetch(1);

    console.log("[*] Waiting for messages in %s. To exit press CTRL+C", queue);

    channel.consume(
      queue,
      async (msg) => {
        const title = msg.content.toString();
        console.log("[x] Received:", title);

        // Simulate work (1 sec)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log("[✔] Done:", title);

        // Acknowledge only after processing
        channel.ack(msg);
      },
      { noAck: false }
    );
  } catch (err) {
    console.error("Consumer error:", err);
    process.exit(1);
  }
}

startConsumer();
