import { EventType } from '@app/shared';
import { IsEnum, IsObject } from 'class-validator';

export class PublishEventRequestDto {
  @IsEnum(EventType)
  type!: EventType;

  @IsObject()
  payload!: Record<string, unknown>;
}
