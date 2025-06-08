import Razorpay from "razorpay";
import prisma from "../config/database.js";
import { payment_status } from "@prisma/client";

async function createOrderHandler(userId: string, fare: number, rideId: string, captainId: string) {
    try {
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
            headers: {
                "Content-Type": "application/json",
                "X-Razorpay-Account": process.env.RAZORPAY_MERCHANT_ID
            }
        });

        const platform_charge: number = (fare * 20) / 100
        const final_amount: number = (fare - platform_charge);

        razorpay.orders.create({
            amount: final_amount * 100, // converted from paise to rupee
            currency: "INR",
            payment_capture: true
        }, async function (err, order) {
            if (err && err instanceof Error) {
                throw new Error(`payment failed of ${userId}: ${err.message}`);
            }

            await prisma.payments.create({
                data: {
                    orderId: order.id,
                    userId: userId,
                    rideId: rideId,
                    captainId: captainId,
                    amount: final_amount,
                    status: payment_status.pending
                }
            })

            console.log(`order: ${JSON.stringify(order)}`);
            return order;
        }
        )

    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error in create-order handler: ${error.message}`);
        }
    }
}

export default createOrderHandler;