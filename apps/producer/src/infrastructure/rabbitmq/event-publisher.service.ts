import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy, RmqRecordBuilder } from '@nestjs/microservices';
import { EventDto, EventType, generateEventId } from '@app/shared';
import { firstValueFrom } from 'rxjs';
import { RABBITMQ_CLIENT } from './rabbitmq.constants';
import { EventSerializer } from './event.serializer';

@Injectable()
export class EventPublishService {
  private readonly logger = new Logger(EventPublishService.name);

  constructor(
    @Inject(RABBITMQ_CLIENT)
    private readonly client: ClientProxy,
    private readonly eventSerializer: EventSerializer,
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

    const serializedEvent = this.eventSerializer.serializeEvent(event);

    const record = new RmqRecordBuilder(serializedEvent)
      .setOptions({
        contentType: 'application/json',
        headers: {
          eventId: event.id,
          eventType: event.type,
        },
      })
      .build();

    await firstValueFrom(this.client.emit(type, record));

    this.logger.log(
      `Event published successfully: id=${event.id}, type=(${event.type})`,
    );

    return event;
  }
}
