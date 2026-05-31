import { IsDateString, IsObject, IsEnum, IsUUID } from 'class-validator';
import { EventType } from '../enums/event-type.enum';

export class EventDto {
  @IsUUID()
  id!: string;

  @IsEnum(EventType)
  type!: EventType;

  @IsObject()
  payload!: Record<string, unknown>;

  @IsDateString()
  createdAt!: string;
}
