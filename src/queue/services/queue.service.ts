import { RedisQueueOperations } from '../redis/queue.operations';
import { ContentOperations } from '../../db/operations/content.operations';
import { ContentEmailOperations } from '../../db/operations/contentEmail.operations';

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
      //_Here we will check if the content is already present in the database
      const content =
        await ContentOperations.findContentByString(contentString);

      if (!content) {
        console.log(`Content not found in database: ${contentString}`);
        return;
      }

      const unsentContentEmails =
        await ContentEmailOperations.getUnsentEmailsForContent(content.id);

      if (!unsentContentEmails || unsentContentEmails.length === 0) {
        console.log(`No unsent emails found for content ${content.id}`);
        return;
      }

      console.log(
        `Found ${unsentContentEmails.length} unsent emails for content ${content.id}`
      );

      for (const contentEmail of unsentContentEmails) {
        try {
          console.log(
            `Pushing content ${content.id} with email ${contentEmail.email.email} to queue`
          );
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
      console.error('Error in prepareAndPushToQueue:', error);
    }
  }
}
