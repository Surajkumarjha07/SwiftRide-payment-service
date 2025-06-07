import { producer } from "../producerInIt.js";

async function sendProducerMessage(topic: string, data: {}) {
    try {
        await producer.send({
            topic,
            messages: [{ value: JSON.stringify(data) }]
        })
    } catch (error) {
        console.log(`error in sending ${topic}: ${error}`);
    }
}

export default sendProducerMessage;
