import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsString } from 'class-validator';

export class SendTelegramNotificationDto {
  @ApiPropertyOptional({
    example: 'Manual notification',
    description: 'Notification title',
  })
  @IsString()
  title!: string;

  @ApiPropertyOptional({
    example: 'Hello from telegram-notifier',
    description: 'Notification message',
  })
  @IsString()
  message!: string;

  @ApiPropertyOptional({
    type: Object,
    example: {
      source: 'manual-test',
    },
    description: 'Additional notification metadata',
  })
  @IsObject()
  metadata!: Record<string, unknown>;
}
