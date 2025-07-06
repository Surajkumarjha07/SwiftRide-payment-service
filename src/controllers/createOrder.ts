import { Request, Response } from "express";
import createOrderHandler from "../services/createOrder.js";

async function createOrder(req: Request, res: Response) {
    try {
        const { userId, captainId, rideId, fare } = req.body;

        const createdOrder = await createOrderHandler(userId, Number(fare), rideId, captainId);

        if (!createdOrder) {
            return res.status(400).json({
                message: "no order created!"
            })
        }

        const { razorpay_order, order } = createdOrder;

        res.status(201).json({
            message: "order created!",
            razorpay_order,
            order
        })

    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error in create-order controller: ${error.message}`);
        }
    }
}

export default createOrder;