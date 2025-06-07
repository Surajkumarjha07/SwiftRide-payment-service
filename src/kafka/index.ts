import { consumerInit } from "./consumerInIt.js";
import paymentDone from "./consumers/paymentDoneConsumer.js";
import kafkaInit from "./kafkaAdmin.js";
import { producerInit } from "./producerInIt.js";

const startKafka = async () => {
    try {
        await kafkaInit();

        console.log("Consumer initialization...");
        await consumerInit();
        console.log("Consumer initialized...");

        console.log("Producer initialization...");
        await producerInit();
        console.log("Producer initializated");
        
        // listening to events
        await paymentDone();

    } catch (error) {
        console.log("error in initializing kafka: ", error);
    }
}

export default startKafka;