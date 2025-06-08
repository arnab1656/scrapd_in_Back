export interface RedisBatchMetadata {
  totalChunks: number;
  startTime: number;
  status: "initializing" | "processing" | "completed" | "error";
  receivedChunks: number;
}

export interface RedisChunkData {
  data: any;
  timestamp: number;
  attempts: number;
}

export interface ChunkError {
  batchId: string;
  chunkIndex: number;
  error: string;
  timestamp: number;
}
