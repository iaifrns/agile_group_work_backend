import { Server } from "socket.io";

let io: Server;

// Initialize Socket.IO server with CORS configuration
export const initSocket = (server: any) => {
  io = new Server(server, {
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

// Get the initialized Socket.IO instance (throws if not initialized)
export const getIo = () => {
  if (!io) {
    throw new Error("Socket not initilized !!");
  }

  return io;
};