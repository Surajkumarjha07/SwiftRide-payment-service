import { NextFunction, Request, Response } from "express";

async function extractUserHeader(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        const userHeader = req.headers["x-user-payload"];

        if (userHeader && typeof userHeader === "string") {
            req.user = JSON.parse(userHeader);
            return next();
        }

        return res.status(400).json({
            message: "Invalid or Missing 'x-user-payload'"
        })

    } catch (error) {
        return res.status(403).json({ message: "User payload malfunctioned or corrupt!" });
    }
}

export default extractUserHeader;