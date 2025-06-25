import { Server, Socket } from 'socket.io';
import {
  QueueDecodeStartData,
  ChunkData,
  ChunkDataComplete,
  ChunkDataFatal,
} from '../types/socket.types';
import { RedisBatchManager } from '../services/redis-batch.service';
import { kafkaProducerDataOrganizer } from '../helpers/kafkaProducerDataOrganizer';
import { KafkaOrchestrator } from '../services/kafkaOrchestrator';

export class SocketHandler {
  private redisBatchManager: RedisBatchManager;

  constructor(private io: Server) {
    this.redisBatchManager = new RedisBatchManager();
  }

  handleConnection(socket: Socket): void {
    console.log('A user connected');
    this.setupEventListeners(socket);
  }

  private setupEventListeners(socket: Socket): void {
    socket.on('queue:decode:start', this.handleQueueDecodeStart.bind(this));
    socket.on('chunk:data', this.handleChunkData.bind(this));
    socket.on('chunk:data:complete', this.handleChunkDataComplete.bind(this));
    socket.on('chunk:data:fatal', this.handleChunkDataFatal.bind(this));
  }

  //_Checked_debugging done
  private async handleQueueDecodeStart(
    data: QueueDecodeStartData
  ): Promise<void> {
    try {
      const batchId = await this.redisBatchManager.initializeBatch(
        data.totalChunks
      );

      this.io.emit('queue:decode:start:ack', {
        status: 'ready',
        batchId,
      });
    } catch (error: any) {
      console.error('Error handling queue decode start:', error);
      this.io.emit('chunk:error', { error: 'init_error' });
    }
  }

  private async handleChunkData(data: ChunkData): Promise<void> {
    try {
      await this.redisBatchManager.storeChunk(
        data.batchId,
        data.chunkIndex,
        data.chunkData
      );

      this.io.emit('chunk:ack', { chunkIndex: data.chunkIndex });
    } catch (error: any) {
      console.error('Error handling chunk data via RedisBatchManager:', error);

      this.io.emit('chunk:error', {
        chunkIndex: data.chunkIndex,
        error: 'redis_chunk_error',
      });
    }
  }

  private async handleChunkDataComplete(
    data: ChunkDataComplete
  ): Promise<void> {
    try {
      const isComplete = await this.redisBatchManager.markBatchComplete(
        data.batchId
      );

      if (isComplete === true) {
        this.io.emit('chunk:data:complete:ack');

        const chunks = await this.redisBatchManager.getAllChunksData(
          data.batchId
        );

        const kafkaProducerData = kafkaProducerDataOrganizer(chunks);

        const kafkaOrchestrator = new KafkaOrchestrator(
          kafkaProducerData,
          this.redisBatchManager,
          data.batchId
        );
        await kafkaOrchestrator.orchestrator();
      } else {
        throw new Error('redis_completion_error');
      }
    } catch (error: any) {
      console.error(
        'Error handling chunk data complete via RedisBatchManager and the error is:',
        error
      );
      this.io.emit('chunk:error', { error: 'redis_completion_error' });
    }
  }

  private async handleChunkDataFatal(data: ChunkDataFatal): Promise<void> {
    try {
      if (data.batchId) {
        await this.redisBatchManager.cleanupBatch(data.batchId);
      } else {
        console.log('cleanupBatch is done without batchId');
      }
    } catch (error: any) {
      console.error('cleanupBatch is failed and the error is --->', error);
    }
  }
}
