import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EventType } from '@app/shared';
import { EventPublishService } from '../infrastructure/rabbitmq/event-publisher.service';
import { PublishEventRequestDto } from './dto/publish-event-request.dto';
import { PublishEventResponseDto } from './dto/publish-event-response.dto';

@ApiTags('events')
@Controller('events')
export class ProducerController {
  constructor(private readonly eventPublisherService: EventPublishService) {}

  @Post()
  @ApiOperation({
    summary: 'Publish event to RabbitMQ',
    description:
      'Creates an event with UUID and publishes it to RabbitMQ queue.',
  })
  @ApiBody({
    type: PublishEventRequestDto,
    examples: {
      systemTestEvent: {
        summary: 'System test event',
        value: {
          type: EventType.SYSTEM_TEST_EVENT,
          payload: {
            message: 'Hello from producer',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Event successfully published',
    type: PublishEventResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request body or unsupported event type',
  })
  @ApiInternalServerErrorResponse({
    description: 'RabbitMQ publishing failed',
  })
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
