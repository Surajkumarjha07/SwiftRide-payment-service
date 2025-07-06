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

        const platform_commission: number = Math.round((fare * 20) / 100);
        const captain_commission: number = Math.round((fare - platform_commission));

        if (isNaN(captain_commission) || captain_commission < 0) {
            console.log("final amount is not valid!", captain_commission);
        }

        const razorpay_order = await new Promise<any>((resolve, reject) => {
            razorpay.orders.create({
                amount: fare * 100,
                currency: "INR",
                payment_capture: true
            }, (err, order) => {
                console.log("Razorpay callback:", { err, order });
                if (err) return reject(err);
                resolve(order);
            });
        });

        console.log(razorpay_order);

        if (!razorpay_order) {
            throw new Error(`Error in creating order!`);
        }

        const order = await prisma.payments.create({
            data: {
                orderId: razorpay_order.id,
                userId: userId,
                rideId: rideId,
                captainId: captainId,
                total_amount: fare,
                captain_commission: captain_commission,
                platform_commission: platform_commission,
                status: payment_status.pending
            }
        })

        console.log(`razorpay_order: ${JSON.stringify(razorpay_order)}`);
        return { razorpay_order, order };


    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error in create-order handler: ${error.message}`);
        }
    }
}

export default createOrderHandler;