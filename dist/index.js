// src/index.ts
import express2 from "express";
import dotenv from "dotenv";

// src/kafka/kafkaClient.ts
import { Kafka, logLevel } from "kafkajs";
var kafka = new Kafka({
  clientId: "payment-service",
  brokers: ["localhost:9092"],
  connectionTimeout: 1e4,
  requestTimeout: 3e4,
  retry: {
    initialRetryTime: 2e3,
    retries: 10
  },
  logLevel: logLevel.ERROR
});
var kafkaClient_default = kafka;

// src/kafka/consumerInIt.ts
var payment_done_consumer = kafkaClient_default.consumer({ groupId: "payments-group" });
async function consumerInit() {
  await Promise.all([
    payment_done_consumer.connect()
  ]);
}

// src/kafka/producerInIt.ts
import { Partitioners } from "kafkajs";
var producer = kafkaClient_default.producer({
  createPartitioner: Partitioners.LegacyPartitioner
});
async function producerInit() {
  await producer.connect();
}

// src/kafka/producers/producerTemplate.ts
async function sendProducerMessage(topic, data) {
  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(data) }]
    });
  } catch (error) {
    console.log(`error in sending ${topic}: ${error}`);
  }
}
var producerTemplate_default = sendProducerMessage;

// src/config/database.ts
import { PrismaClient } from "@prisma/client";
var prisma = new PrismaClient();
var database_default = prisma;

// src/kafka/handlers/paymentDone.handler.ts
import { payment_status } from "@prisma/client";
async function handlePaymentDone({ message }) {
  try {
    console.log(JSON.parse(message.value.toString()));
    const { fare, payment_id, orderId, order, userId, rideId, captainId } = JSON.parse(message.value.toString());
    if (!payment_id || !orderId) {
      await database_default.payments.update({
        where: {
          rideId
        },
        data: {
          paymentId: payment_id,
          status: payment_status.failed
        }
      });
      throw new Error(`Error in payment service: Payment ID and Order ID are missing!`);
    }
    await database_default.payments.update({
      where: {
        orderId
      },
      data: {
        paymentId: payment_id,
        status: payment_status.success
      }
    });
    await producerTemplate_default("payment-settled", { fare, payment_id, orderId, order, userId, rideId, captainId });
    await producerTemplate_default("ride-completed-notify-user", { fare, payment_id, orderId, order, userId, rideId, captainId });
    await producerTemplate_default("update-captain-earnings", { fare, payment_id, orderId, order, userId, rideId, captainId });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error in payment-requested handler: ${error.message}`);
    }
  }
}
var paymentDone_handler_default = handlePaymentDone;

// src/kafka/consumers/paymentDone.consumer.ts
async function paymentDone() {
  try {
    await payment_done_consumer.subscribe({ topic: "payment-done", fromBeginning: true });
    await payment_done_consumer.run({
      eachMessage: paymentDone_handler_default
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error in payment-requested consumer: ${error.message}`);
    }
  }
}
var paymentDone_consumer_default = paymentDone;

// src/kafka/kafkaAdmin.ts
async function kafkaInit() {
  const admin = kafkaClient_default.admin();
  console.log("Admin connecting...");
  await admin.connect();
  console.log("Admin connected...");
  const topics = ["payment-done"];
  const existingTopics = await admin.listTopics();
  const topicsToCreate = topics.filter((t) => !existingTopics.includes(t));
  if (topicsToCreate.length > 0) {
    await admin.createTopics({
      topics: topicsToCreate.map((t) => ({ topic: t, numPartitions: 1 }))
    });
  }
  console.log("Topics created!");
  await admin.disconnect();
}
var kafkaAdmin_default = kafkaInit;

// src/kafka/index.kafka.ts
var startKafka = async () => {
  try {
    await kafkaAdmin_default();
    console.log("Consumer initialization...");
    await consumerInit();
    console.log("Consumer initialized...");
    console.log("Producer initialization...");
    await producerInit();
    console.log("Producer initializated");
    await paymentDone_consumer_default();
  } catch (error) {
    console.log("error in initializing kafka: ", error);
  }
};
var index_kafka_default = startKafka;

// src/routes/payment.route.ts
import express from "express";

// src/services/createOrder.service.ts
import Razorpay from "razorpay";
import { payment_status as payment_status2 } from "@prisma/client";
async function createOrderHandler(userId, fare, rideId, captainId) {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
      headers: {
        "Content-Type": "application/json",
        "X-Razorpay-Account": process.env.RAZORPAY_MERCHANT_ID
      }
    });
    const platform_commission = Math.round(fare * 20 / 100);
    const captain_commission = Math.round(fare - platform_commission);
    if (isNaN(captain_commission) || captain_commission < 0) {
      console.log("final amount is not valid!", captain_commission);
    }
    const razorpay_order = await new Promise((resolve, reject) => {
      razorpay.orders.create({
        amount: fare * 100,
        currency: "INR",
        payment_capture: true
      }, (err, order2) => {
        console.log("Razorpay callback:", { err, order: order2 });
        if (err) return reject(err);
        resolve(order2);
      });
    });
    console.log(razorpay_order);
    if (!razorpay_order) {
      throw new Error(`Error in creating order!`);
    }
    const order = await database_default.payments.create({
      data: {
        orderId: razorpay_order.id,
        userId,
        rideId,
        captainId,
        total_amount: fare,
        captain_commission,
        platform_commission,
        status: payment_status2.pending
      }
    });
    console.log(`razorpay_order: ${JSON.stringify(razorpay_order)}`);
    return { razorpay_order, order };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error in create-order handler: ${error.message}`);
    }
  }
}
var createOrder_service_default = createOrderHandler;

// src/controllers/createOrder.controller.ts
async function createOrder(req, res) {
  try {
    const { userId } = req.user;
    const { captainId, rideId, fare } = req.body;
    if (!userId || !captainId || !rideId || !fare) {
      console.log("credentials missing! ", captainId, rideId, userId, fare);
      return res.status(400).json({
        message: "credentials missing!",
        captainId
      });
    }
    const createdOrder = await createOrder_service_default(userId, Number(fare), rideId, captainId);
    if (!createdOrder) {
      return res.status(400).json({
        message: "no order created!"
      });
    }
    const { razorpay_order, order } = createdOrder;
    res.status(201).json({
      message: "order created!",
      razorpay_order,
      order
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error in create-order controller: ${error.message}`);
    }
  }
}
var createOrder_controller_default = createOrder;

// src/routes/payment.route.ts
var router = express.Router();
router.post("/create-order", createOrder_controller_default);
var payment_route_default = router;

// src/index.ts
import cors from "cors";

// src/middlewares/extractUserHeader.middleware.ts
async function extractUserHeader(req, res, next) {
  try {
    const userHeader = req.headers["x-user-payload"];
    if (userHeader && typeof userHeader === "string") {
      req.user = JSON.parse(userHeader);
      return next();
    }
    return res.status(400).json({
      message: "Invalid or Missing 'x-user-payload'"
    });
  } catch (error) {
    return res.status(403).json({ message: "User payload malfunctioned or corrupt!" });
  }
}
var extractUserHeader_middleware_default = extractUserHeader;

// src/index.ts
dotenv.config();
var app = express2();
var corsOptions = {
  origin: "http://localhost:3000",
  credentials: true
};
app.use(cors(corsOptions));
app.use(express2.json());
app.use(express2.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.send("payment service is running!");
});
index_kafka_default();
app.use("/orders", extractUserHeader_middleware_default, payment_route_default);
app.listen(Number(process.env.PORT), "0.0.0.0", () => {
  console.log("payment service is running!");
});
