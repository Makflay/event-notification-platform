import { IsObject, IsOptional, IsString } from 'class-validator';

export class SendTelegramNotificationDto {
  @IsOptional()
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  message!: string;

  @IsOptional()
  @IsObject()
  metadata!: Record<string, unknown>;
}
