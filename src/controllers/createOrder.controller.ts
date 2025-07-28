import { Request, Response } from "express";
import createOrderHandler from "../services/createOrder.service.js";

async function createOrder(req: Request, res: Response): Promise<any> {
    try {
        const { userId } = req.user;
        const { captainId, rideId, fare } = req.body;

        if (!userId || !captainId || !rideId || !fare) {
            console.log("credentials missing! ", captainId, rideId, userId, fare);

            return res.status(400).json({
                message: "credentials missing!",
                captainId
            })
        }

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