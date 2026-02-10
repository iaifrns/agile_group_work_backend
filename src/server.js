import express from "express";
import { prisma } from "./lib/prisma.js";
import { config } from "dotenv";

import studentRoute from "./routes/studentRoute.js";
import authRoute from "./routes/authRoute.js";

const app = express();

config();
prisma.$connect();

//middleware
app.use(express.json());

//routes
app.use("/student", studentRoute);
app.use("/auth", authRoute);

const port = 5002;

app.listen(port, () => {
  console.log("Server runing on port ", port);
});

process.on("unhandledRejection", (e) => {
  console.log("an unhandle rejection error occured ", e);
  prisma.$disconnect();
});

process.on("uncaughtException", (e) => {
  console.log("an uncaught exception error ", e);
  prisma.$disconnect();
});
