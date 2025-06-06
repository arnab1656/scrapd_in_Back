import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { ServerConfig } from "./config/server.config";
import { SocketHandler } from "./socket/socketHandler";

const app = express();

app.use(cors(ServerConfig.cors));

const httpServer = createServer(app);

const io = new Server(httpServer, ServerConfig.socket);
const socketHandler = new SocketHandler(io);

io.on("connection", (socket) => socketHandler.handleConnection(socket));

httpServer.listen(ServerConfig.port, () => {
  console.log(`Server is running on port ${ServerConfig.port}`);
});
