import { ChunkInfo, ExtractedDataType } from "./common.types";

export interface BatchInfo<T> {
  batch: ChunkInfo<T>[];
  totalBatchSizeInMB: number;
  numberOfChunks: number;
}

export interface ChunkedDataPayload<T = ExtractedDataType> {
  chunkedData: BatchInfo<T>;
}

export interface QueueDecodeStartData {
  totalChunks: number;
  startTime: number;
}

export interface ChunkData {
  batchId: string;
  chunkIndex: number;
  chunkData: ChunkInfo<ExtractedDataType>;
}

export interface ChunkDataComplete {
  batchId: string;
  status: string;
  stats: {
    processedChunks: number;
    duration: string;
  };
}

export interface ChunkDataFatal {
  batchId?: string;
  // status: string;
  // error: {
  //   chunkIndex: number;
  //   reason: string;
  //   attempts: number;
  // };
}
