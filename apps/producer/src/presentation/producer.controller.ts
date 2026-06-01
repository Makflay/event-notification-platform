import { Body, Controller, Post } from '@nestjs/common';
import { EventPublishService } from '../infrastructure/rabbitmq/event-publisher.service';
import { PublishEventRequestDto } from './src/publish-event-request.dto';

@Controller('events')
export class ProducerController {
  constructor(private readonly eventPublisherService: EventPublishService) {}

  @Post()
  async publishEvent(
    @Body() publishEventRequestDto: PublishEventRequestDto,
  ): Promise<{ eventId: string; status: string }> {
    const event = await this.eventPublisherService.publish(
      publishEventRequestDto.type,
      publishEventRequestDto.payload,
    );

    return {
      eventId: event.id,
      status: 'published',
    };
  }
}
