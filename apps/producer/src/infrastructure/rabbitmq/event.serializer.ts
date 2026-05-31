import { Injectable, Logger } from '@nestjs/common';
import { EventDto } from '@app/shared';

@Injectable()
export class EventSerializer {
  private readonly logger = new Logger(EventSerializer.name);

  serializeEvent(event: EventDto): Buffer {
    try {
      const serializedEvent = JSON.stringify(event);

      return Buffer.from(serializedEvent);
    } catch (error) {
      this.logger.error('Failed to serialize event', error);

      throw new Error('Event serialization failed');
    }
  }
}
