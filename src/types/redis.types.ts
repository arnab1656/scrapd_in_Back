import { ChunkInfo, ExtractedDataType } from './common.types';

export interface RedisBatchMetadata {
  totalChunks: number;
  startTime: number;
  status: 'initializing' | 'processing' | 'completed' | 'error';
  receivedChunks: number;
}

export interface RedisChunkData {
  data: ChunkInfo<ExtractedDataType>;
  timestamp: number;
  attempts: number;
}

export interface ChunkError {
  batchId: string;
  chunkIndex: number;
  error: string;
  timestamp: number;
}
