💳 Payment Service

The Payment Service is an internal backend service of SwiftRide (Ride-Sharing platform), which is responsible for initiating and creating payment orders, ensuring smooth and secure transactions between riders and captains.

-----------------------------------------------------------------------------------------------------------------------------------------------

🚀 Features

✅ Initiate and create Razorpay's payment order   
✅ Saves payment details to database  
✅ Track payment status - `pending`, `success`, `failure`  
✅ Integrated with Rate-Limiter (Token Bucket Algorithm) to prevent the server from being exploited by a single user or captain  

-----------------------------------------------------------------------------------------------------------------------------------------------

🛠 Technologies Used

✅ Node.js  
✅ Express  
✅ TypeScript  
✅ Kafka  
✅ Docker  

-----------------------------------------------------------------------------------------------------------------------------------------------

📋 Prerequisites

Ensure you have the following installed ->  
Node.js (for JavaScript/TypeScript backend)  
Express  

Required Packages ->  
cors  
dotenv  
nodemon  
prisma  
kafkajs  
razorpay  
tsup (for TypeScript)  
typescript (for TypeScript)  
concurrently (for TypeScript)  

Ensure you have the following tools running in your local machine ->  
Confluent Kafka Docker Image  
Redis Docker Image  

-----------------------------------------------------------------------------------------------------------------------------------------------

📌 Steps to Run

1️⃣ Clone the repository

git clone https://github.com/Surajkumarjha07/SwiftRide-payment-service.git

2️⃣ Install Dependencies

npm install

3️⃣ Set Up Environment Variables

Create a .env file and configure the following variables ->  

DATABASE_URL=your-database-url
PORT=your-port
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
RAZORPAY_MERCHANT_ID=your-razorpay-merchant-id

4️⃣ Run the Application

nodemon index.js

🚀 Your Payment Service is now up and running! 🎉

