"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIo = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
let io;
// Initialize Socket.IO server with CORS configuration
const initSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: "http://localhost:5173", // Frontend development server
            credentials: true, // Allow cookies to be sent
        },
    });
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);
        // Allow user to join a room identified by their userId for targeted notifications
        socket.on("join_room", (userId) => {
            socket.join(userId);
        });
    });
    return io;
};
exports.initSocket = initSocket;
// Get the initialized Socket.IO instance (throws if not initialized)
const getIo = () => {
    if (!io) {
        throw new Error("Socket not initilized !!");
    }
    return io;
};
exports.getIo = getIo;
