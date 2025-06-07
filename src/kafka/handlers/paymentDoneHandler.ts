import { EachMessagePayload } from "kafkajs";
import Razorpay from "razorpay";
import sendProducerMessage from "../producers/producerTemplate.js";
import prisma from "../../config/database.js";
import { payment_status } from "@prisma/client";

async function handlePaymentDone({ message }: EachMessagePayload) {
    try {
        const { userId, captainId, rideId, fare } = JSON.parse(message.value!.toString());

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
            headers: {
                "Content-Type": "application/json",
                "X-Razorpay-Account": process.env.RAZORPAY_MERCHANT_ID
            }
        });

        const payment_id = `${userId}_${Date.now()}`;
        const platform_charge = (fare * 20) / 100
        const final_amount = (fare - platform_charge)*100;

        razorpay.orders.create({
            amount: final_amount,
            currency: "INR",
            receipt: payment_id,
            payment_capture: true
        }, async function (err, order) {
            if (err && err instanceof Error) {
                await prisma.payments.create({
                    data: {
                        paymentId: payment_id,
                        rideId: rideId,
                        captainId: captainId,
                        userId: userId,
                        amount: final_amount,
                        status: payment_status.failed
                    }
                })
                throw new Error(`payment failed of ${userId}: ${err.message}`);
            }

            await prisma.payments.create({
                data: {
                    paymentId: payment_id,
                    rideId: rideId,
                    captainId: captainId,
                    userId: userId,
                    amount: final_amount,
                    status: payment_status.success
                }
            })

            console.log("order: ", JSON.stringify(order));

            await sendProducerMessage("payment-settled", { order, userId, captainId, rideId, fare }); // will be listened by ride service
            await sendProducerMessage("ride-completed-notify-user", { order, userId, captainId, rideId, fare })  // will be listened by user service
        })

    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error in payment-requested handler: ${error.message}`);
        }
    }
}

export default handlePaymentDone;