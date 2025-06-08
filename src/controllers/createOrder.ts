import { Request, Response } from "express";
import createOrderHandler from "../services/createOrder.js";

async function createOrder(req: Request, res: Response) {
    try {
        const { userId, captainId, rideId, fare } = req.body;

        const order = await createOrderHandler(userId, Number(fare), captainId, rideId);

        res.status(201).json({
            message: "order created!",
            order
        })

    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error in create-order controller: ${error.message}`);
        }
    }
}

export default createOrder;