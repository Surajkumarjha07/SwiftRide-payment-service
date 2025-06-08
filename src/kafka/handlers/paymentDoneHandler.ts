import { EachMessagePayload } from "kafkajs";
import sendProducerMessage from "../producers/producerTemplate.js";
import prisma from "../../config/database.js";
import { payment_status } from "@prisma/client";

async function handlePaymentDone({ message }: EachMessagePayload) {
    try {
        const { userId, captainId, rideId, fare, payment_id } = JSON.parse(message.value!.toString());

        const platform_charge: number = (parseInt(fare) * 20) / 100;
        const final_amount: number = parseInt(fare) - platform_charge;

        if (!userId || !captainId || !rideId || !fare || !payment_id) {
            await prisma.payments.create({
                data: {
                    paymentId: payment_id,
                    userId: userId,
                    rideId: rideId,
                    captainId: captainId,
                    amount: final_amount,
                    status: payment_status.failed
                }
            })
            throw new Error(`Error in payment service: Required fields are missing!`);
        }

        await prisma.payments.create({
            data: {
                paymentId: payment_id,
                userId: userId,
                rideId: rideId,
                captainId: captainId,
                amount: final_amount,
                status: payment_status.success
            }
        })

        await sendProducerMessage("payment-settled", { userId, captainId, rideId, fare }); // will be listened by ride service
        await sendProducerMessage("ride-completed-notify-user", { userId, captainId, rideId, fare })  // will be listened by user service

    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error in payment-requested handler: ${error.message}`);
        }
    }
}

export default handlePaymentDone;