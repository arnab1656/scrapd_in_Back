export interface ExtractedDataType {
  id: number;
  author: string | null;
  content: string | null;
  email: Array<string> | null;
  phoneNumber: Array<string> | null;
  linkedInURL: string | null;
}

export interface ChunkInfo<T> {
  chunk: T[];
  sizeInMB: number;
}
