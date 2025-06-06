export interface ChunkInfo<T> {
  data: T[];
  sizeInMB: number;
}

export interface ExtractedDataType {
  id: number;
  author: string | null;
  content: string | null;
  email: Array<string> | null;
  phoneNumber: Array<string> | null;
  linkedInURL: string | null;
}

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
  chunkIndex: number;
  chunkData: any;
}

export interface ChunkDataComplete {
  status: string;
  stats: {
    processedChunks: number;
    duration: string;
  };
}

export interface ChunkDataFatal {
  status: string;
  error: {
    chunkIndex: number;
    reason: string;
    attempts: number;
  };
}
