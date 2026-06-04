import { EventType } from '@app/shared';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsObject } from 'class-validator';

export class PublishEventRequestDto {
  @ApiProperty({
    enum: EventType,
    example: EventType.SYSTEM_TEST_EVENT,
    description: 'Type of event to publish',
  })
  @IsEnum(EventType)
  type!: EventType;

  @ApiProperty({
    type: Object,
    example: {
      message: 'Hello from producer',
    },
    description: 'Event payload serialized as JSON object',
  })
  @IsObject()
  payload!: Record<string, unknown>;
}
