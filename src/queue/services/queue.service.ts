import { RedisQueueOperations } from "../redis/queue.operations";
import { PrismaService } from "../../lib/prisma";
import { ContentOperations } from "../../db/operations/content.operations";

const prisma = PrismaService.getInstance().getClient();

export class QueueService {
  private static instance: QueueService;
  private queueOperations: RedisQueueOperations;

  private constructor() {
    this.queueOperations = RedisQueueOperations.getInstance();
  }

  public static getInstance(): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService();
    }
    return QueueService.instance;
  }

  public async prepareAndPushToQueue(contentString: string): Promise<void> {
    try {
      const content = await ContentOperations.findContentByString(
        contentString
      );

      if (!content) {
        return;
      }

      const contentEmails = await prisma.contentEmail.findMany({
        where: {
          contentId: content.id,
        },
        include: {
          email: true,
        },
      });

      if (!contentEmails || contentEmails.length === 0) {
        return;
      }

      for (const contentEmail of contentEmails) {
        try {
          await this.queueOperations.pushToQueue(
            content.id,
            contentEmail.emailId
          );
        } catch (error) {
          console.error(
            `Error queuing content ${content.id} with email ${contentEmail.emailId}:`,
            error
          );
          continue;
        }
      }
    } catch (error) {
      console.error("Error in prepareAndPushToQueue:", error);
    }
  }
}
