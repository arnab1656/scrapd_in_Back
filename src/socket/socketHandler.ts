import { Server, Socket } from "socket.io";
import {
  ChunkedDataPayload,
  QueueDecodeStartData,
  ChunkData,
  ChunkDataComplete,
  ChunkDataFatal,
} from "../types/socket.types";

export class SocketHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  handleConnection(socket: Socket): void {
    console.log("A user connected");

    this.setupEventListeners(socket);
  }

  private setupEventListeners(socket: Socket): void {
    socket.on("chunkedData-incoming", this.handleChunkedData.bind(this));
    socket.on("queue:decode:start", this.handleQueueDecodeStart.bind(this));
    socket.on("chunk:data", this.handleChunkData.bind(this));
    socket.on("chunk:data:complete", this.handleChunkDataComplete.bind(this));
    socket.on("chunk:data:fatal", this.handleChunkDataFatal.bind(this));
  }

  private handleChunkedData(data: ChunkedDataPayload): void {
    console.log(
      "incoming data from client as chunkedData-incoming",
      data.chunkedData.batch
    );

    for (const [index, chunk] of data.chunkedData.batch.entries()) {
      console.log(`Chunk ${index + 1}:`, chunk);
    }
  }

  private handleQueueDecodeStart(data: QueueDecodeStartData): void {
    console.log("queue:decode:start event received with data:", data);
    this.io.emit("queue:decode:start:ack", { status: "ready" });
  }

  private handleChunkData(data: ChunkData): void {
    console.log("chunk:data event received with data:", data);
    this.io.emit("chunk:ack", { chunkIndex: data.chunkIndex });
  }

  private handleChunkDataComplete(data: ChunkDataComplete): void {
    console.log("chunk:data:complete event received with data:", data);
    this.io.emit("chunk:data:complete:ack");
  }

  private handleChunkDataFatal(data: ChunkDataFatal): void {
    console.log("chunk:data:fatal event received with data:", data);
    this.io.emit("chunk:error", { status: "error" });
  }
}
