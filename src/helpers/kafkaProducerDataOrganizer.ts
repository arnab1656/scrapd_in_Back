import { ExtractedDataType } from '../types/common.types';
import { RedisChunkData } from '../types/redis.types';

export const kafkaProducerDataOrganizer = (
  ChunkData: Array<RedisChunkData>
) => {
  const kafkaProducerData: Array<ExtractedDataType> = [];

  for (const sigleBigChunk of ChunkData) {
    for (const singleChunk of sigleBigChunk.data.chunk) {
      kafkaProducerData.push(singleChunk);
    }
  }

  return kafkaProducerData;
};
