import express, { Request, Response } from "express";
import dotenv from "dotenv";
import startKafka from "./kafka/index.kafka.js";
import paymentRoutes from "./routes/payment.route.js";
import cors from "cors";
import extractUserHeader from "./middlewares/extractUserHeader.middleware.js";

dotenv.config();

const app = express();

const corsOptions = {
    origin: "http://localhost:3000",
    credentials: true
}

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
    res.send("payment service is running!");
});

// kafka setup
startKafka();

app.use("/orders", extractUserHeader, paymentRoutes);

app.listen(Number(process.env.PORT), "0.0.0.0", () => {
    console.log("payment service is running!");
})