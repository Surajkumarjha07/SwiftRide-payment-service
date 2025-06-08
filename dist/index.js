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

// src/kafka/handlers/paymentDoneHandler.ts
import { payment_status } from "@prisma/client";
async function handlePaymentDone({ message }) {
  try {
    const { userId, captainId, rideId, fare, payment_id } = JSON.parse(message.value.toString());
    const platform_charge = parseInt(fare) * 20 / 100;
    const final_amount = parseInt(fare) - platform_charge;
    if (!userId || !captainId || !rideId || !fare || !payment_id) {
      await database_default.payments.create({
        data: {
          paymentId: payment_id,
          userId,
          rideId,
          captainId,
          amount: final_amount,
          status: payment_status.failed
        }
      });
      throw new Error(`Error in payment service: Required fields are missing!`);
    }
    await database_default.payments.create({
      data: {
        paymentId: payment_id,
        userId,
        rideId,
        captainId,
        amount: final_amount,
        status: payment_status.success
      }
    });
    await producerTemplate_default("payment-settled", { userId, captainId, rideId, fare });
    await producerTemplate_default("ride-completed-notify-user", { userId, captainId, rideId, fare });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error in payment-requested handler: ${error.message}`);
    }
  }
}
var paymentDoneHandler_default = handlePaymentDone;

// src/kafka/consumers/paymentDoneConsumer.ts
async function paymentDone() {
  try {
    await payment_done_consumer.subscribe({ topic: "payment-done", fromBeginning: true });
    await payment_done_consumer.run({
      eachMessage: paymentDoneHandler_default
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error in payment-requested consumer: ${error.message}`);
    }
  }
}
var paymentDoneConsumer_default = paymentDone;

// src/kafka/kafkaAdmin.ts
async function kafkaInit() {
  const admin = kafkaClient_default.admin();
  console.log("Admin connecting...");
  await admin.connect();
  console.log("Admin connected...");
  const topics = ["payment-requested"];
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

// src/kafka/index.ts
var startKafka = async () => {
  try {
    await kafkaAdmin_default();
    console.log("Consumer initialization...");
    await consumerInit();
    console.log("Consumer initialized...");
    console.log("Producer initialization...");
    await producerInit();
    console.log("Producer initializated");
    await paymentDoneConsumer_default();
  } catch (error) {
    console.log("error in initializing kafka: ", error);
  }
};
var kafka_default = startKafka;

// src/routes/payment.routes.ts
import express from "express";

// src/services/createOrder.ts
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
    const platform_charge = fare * 20 / 100;
    const final_amount = fare - platform_charge;
    razorpay.orders.create(
      {
        amount: final_amount * 100,
        // converted from paise to rupee
        currency: "INR",
        payment_capture: true
      },
      async function(err, order) {
        if (err && err instanceof Error) {
          throw new Error(`payment failed of ${userId}: ${err.message}`);
        }
        await database_default.payments.create({
          data: {
            orderId: order.id,
            userId,
            rideId,
            captainId,
            amount: final_amount,
            status: payment_status2.pending
          }
        });
        console.log(`order: ${JSON.stringify(order)}`);
        return order;
      }
    );
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error in create-order handler: ${error.message}`);
    }
  }
}
var createOrder_default = createOrderHandler;

// src/controllers/createOrder.ts
async function createOrder(req, res) {
  try {
    const { userId, captainId, rideId, fare } = req.body;
    const order = await createOrder_default(userId, Number(fare), captainId, rideId);
    res.status(201).json({
      message: "order created!",
      order
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error in create-order controller: ${error.message}`);
    }
  }
}
var createOrder_default2 = createOrder;

// src/routes/payment.routes.ts
var router = express.Router();
router.post("/create-order", createOrder_default2);
var payment_routes_default = router;

// src/index.ts
import cors from "cors";
dotenv.config();
var app = express2();
var corsOptions = {
  origin: "*",
  credentials: true
};
app.use(cors(corsOptions));
app.use(express2.json());
app.use(express2.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.send("payment service is running!");
});
kafka_default();
app.use("/orders", payment_routes_default);
app.listen(Number(process.env.PORT), "0.0.0.0", () => {
  console.log("payment service is running!");
});
