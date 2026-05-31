import { IsDateString, IsObject, IsString, IsUUID } from 'class-validator';

export class EventDto {
  @IsUUID()
  id: string;

  @IsString()
  type: string;

  @IsObject()
  payload: Record<string, unknown>;

  @IsDateString()
  createdAt: string;
}
