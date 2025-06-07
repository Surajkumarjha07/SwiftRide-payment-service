import kafka from "./kafkaClient.js";

const payment_done_consumer = kafka.consumer({ groupId: "payments-group" });

async function consumerInit() {
    await Promise.all([
        payment_done_consumer.connect()
    ])
}

export { consumerInit, payment_done_consumer };