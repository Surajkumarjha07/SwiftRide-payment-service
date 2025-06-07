import { payment_done_consumer } from "../consumerInIt.js";
import handlePaymentDone from "../handlers/paymentDoneHandler.js";

async function paymentDone() {
    try {

        await payment_done_consumer.subscribe({ topic: "payment-done", fromBeginning: true });

        await payment_done_consumer.run({
            eachMessage: handlePaymentDone
        })

    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error in payment-requested consumer: ${error.message}`);
        }
    }
}

export default paymentDone;