import express from "express";
import { Server } from "socket.io";
import http from "http";
import { prisma } from "./lib/prisma";
import { config } from "dotenv";
import cors from "cors";
import "dotenv/config";
import studentRoute from "./routes/studentRoute";
import authRoute from "./routes/authRoute";
import groupRoute from "./routes/groupRoute";
import requestRoute from "./routes/requestRoute";
import createTFRoutes from "./routes/createTFRoute";
import cookieParser from "cookie-parser";
import notificationRoute from "./routes/notificationRoute";
import { initSocket } from "./socket";

const app = express();
const server = http.createServer(app);

//socket io
initSocket(server)

config();
prisma.$connect();

//middleware
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);
app.use(cookieParser());

//routes
app.use("/student", studentRoute);
app.use("/auth", authRoute);
app.use("/groups", groupRoute);
app.use("/group_request", requestRoute);
app.use("/tasks", createTFRoutes);
app.use("/notification", notificationRoute);

const port = 5002;

app.listen(port, () => {
  console.log("Server runing on port ", port);
});

server.listen(5001, () => {
  console.log("socket runing on port 5001")
})

process.on("unhandledRejection", (e) => {
  console.log("an unhandle rejection error occured ", e);
  prisma.$disconnect();
});

process.on("uncaughtException", (e) => {
  console.log("an uncaught exception error ", e);
  prisma.$disconnect();
});
