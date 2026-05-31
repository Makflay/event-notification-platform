import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { EventDto, EventType, generateEventId } from '@app/shared';
import { firstValueFrom } from 'rxjs';
import { RABBITMQ_CLIENT } from './rabbitmq.constants';

@Injectable()
export class EventPublishService {
  private readonly logger = new Logger(EventPublishService.name);

  constructor(
    @Inject(RABBITMQ_CLIENT)
    private readonly client: ClientProxy,
  ) {}

  async publish(
    type: EventType,
    payload: Record<string, unknown>,
  ): Promise<EventDto> {
    const event: EventDto = {
      id: generateEventId(),
      type,
      payload,
      createdAt: new Date().toISOString(),
    };

    await firstValueFrom(this.client.emit(type, event));

    this.logger.log(
      `Event published successfully: ${event.id} (${event.type})`,
    );

    return event;
  }
}
