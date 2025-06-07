import express, { Request, Response } from "express";
import dotenv from "dotenv";
import startKafka from "./kafka/index.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
    res.send("payment service is running!");
});

// kafka setup
startKafka();

app.listen(Number(process.env.PORT), "0.0.0.0", () => {
    console.log("payment service is running!");
})