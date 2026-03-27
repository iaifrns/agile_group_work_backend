import { Server } from "socket.io";

let io: Server;

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_room", (userId) => {
      socket.join(userId);
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) {
    throw new Error("Socket not initilized !!");
  }

  return io;
};
