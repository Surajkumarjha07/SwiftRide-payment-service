import { EachMessagePayload } from "kafkajs";
import sendProducerMessage from "../producers/producerTemplate.js";
import prisma from "../../config/database.js";
import { payment_status } from "@prisma/client";

async function handlePaymentDone({ message }: EachMessagePayload) {
    try {
        console.log(JSON.parse(message.value!.toString()));
        const { fare, payment_id, orderId, order, userId, rideId, captainId } = JSON.parse(message.value!.toString());

        if (!payment_id || !orderId) {
            await prisma.payments.update({
                where: {
                    rideId: rideId
                },

                data: {
                    paymentId: payment_id,
                    status: payment_status.failed
                }
            });

            throw new Error(`Error in payment service: Payment ID and Order ID are missing!`);
        }

        await prisma.payments.update({
            where: {
                orderId: orderId
            },

            data: {
                paymentId: payment_id,
                status: payment_status.success
            }
        })

        // will be consumed by ride service
        await sendProducerMessage("payment-settled", { fare, payment_id, orderId, order, userId, rideId, captainId });

        // will be consumed by user service
        await sendProducerMessage("ride-completed-notify-user", { fare, payment_id, orderId, order, userId, rideId, captainId })

        // will be consumed by captain-service
        await sendProducerMessage("update-captain-earnings", { fare, payment_id, orderId, order, userId, rideId, captainId });

    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error in payment-requested handler: ${error.message}`);
        }
    }
}

export default handlePaymentDone;