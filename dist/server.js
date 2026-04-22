"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = require("dotenv");
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const prisma_1 = require("./lib/prisma");
const authRoute_1 = __importDefault(require("./routes/authRoute"));
const createTFRoute_1 = __importDefault(require("./routes/createTFRoute"));
const groupRoute_1 = __importDefault(require("./routes/groupRoute"));
const notificationRoute_1 = __importDefault(require("./routes/notificationRoute"));
const requestRoute_1 = __importDefault(require("./routes/requestRoute"));
const studentRoute_1 = __importDefault(require("./routes/studentRoute"));
const scheduleRoute_1 = __importDefault(require("./routes/scheduleRoute"));
const socket_1 = require("./socket");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Initialize Socket.IO for real-time notifications
(0, socket_1.initSocket)(server);
(0, dotenv_1.config)(); // Load environment variables
prisma_1.prisma.$connect(); // Connect to database
// Express middleware
app.use(express_1.default.json()); // Parse JSON request bodies
app.use((0, cors_1.default)({
    origin: "http://localhost:5173", // Frontend development server
    credentials: true, // Allow cookies to be sent
    methods: ["GET", "POST", "PUT", "DELETE"],
}));
app.use((0, cookie_parser_1.default)()); // Parse cookies from requests
// API routes
app.use("/student", studentRoute_1.default); // Student profile and user management
app.use("/auth", authRoute_1.default); // Authentication (register, login, logout)
app.use("/groups", groupRoute_1.default); // Group management and membership
app.use("/group_request", requestRoute_1.default); // Join request handling
app.use("/tasks", createTFRoute_1.default); // Task and feedback management
app.use("/notification", notificationRoute_1.default); // User notifications
app.use("/schedule", scheduleRoute_1.default); // Calendar/schedule management
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
    prisma_1.prisma.$disconnect(); // Close database connection
});
process.on("uncaughtException", (e) => {
    console.log("an uncaught exception error ", e);
    prisma_1.prisma.$disconnect();
});
