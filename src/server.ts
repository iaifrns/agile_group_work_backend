import cookieParser from "cookie-parser";
import cors from "cors";
import { config } from "dotenv";
import "dotenv/config";
import express from "express";
import http from "http";
import { prisma } from "./lib/prisma";
import authRoute from "./routes/authRoute";
import createTFRoutes from "./routes/createTFRoute";
import groupRoute from "./routes/groupRoute";
import notificationRoute from "./routes/notificationRoute";
import requestRoute from "./routes/requestRoute";
import studentRoute from "./routes/studentRoute";
import scheduleRouter from "./routes/scheduleRoute";
import { initSocket } from "./socket";

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO for real-time notifications
initSocket(server);

config(); // Load environment variables
prisma.$connect(); // Connect to database

// Express middleware
app.use(express.json()); // Parse JSON request bodies
app.use(
  cors({
    origin: "http://localhost:5173", // Frontend development server
    credentials: true, // Allow cookies to be sent
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);
app.use(cookieParser()); // Parse cookies from requests

// API routes
app.use("/student", studentRoute);      // Student profile and user management
app.use("/auth", authRoute);            // Authentication (register, login, logout)
app.use("/groups", groupRoute);         // Group management and membership
app.use("/group_request", requestRoute); // Join request handling
app.use("/tasks", createTFRoutes);      // Task and feedback management
app.use("/notification", notificationRoute); // User notifications
app.use("/schedule", scheduleRouter);   // Calendar/schedule management

const port = 5002;

// Express HTTP server
app.listen(port, () => {
  console.log("Server runing on port ", port);
});

// Socket.IO server on separate port for real-time events
server.listen(5001, () => {
  console.log("socket runing on port 5001");
});

// Graceful shutdown handlers
process.on("unhandledRejection", (e) => {
  console.log("an unhandle rejection error occured ", e);
  prisma.$disconnect(); // Close database connection
});

process.on("uncaughtException", (e) => {
  console.log("an uncaught exception error ", e);
  prisma.$disconnect();
});