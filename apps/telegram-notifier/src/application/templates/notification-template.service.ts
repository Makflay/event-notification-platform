import { Injectable } from '@nestjs/common';

export interface TelegramNotificationPayload {
  title: string;
  message: string;
  metadata: Record<string, unknown>;
}

@Injectable()
export class NotificationTemplateService {
  buildTelegramNotification(payload: TelegramNotificationPayload): string {
    const lines: string[] = [];

    if (payload.title) {
      lines.push(`Title: ${payload.title}`);
    }

    if (payload.message) {
      lines.push(`Message: ${payload.message}`);
    }

    if (payload.metadata && Object.keys(payload.metadata).length > 0) {
      lines.push('Metadata:');

      for (const [key, value] of Object.entries(payload.metadata)) {
        lines.push(`- ${key}: ${String(value)}`);
      }
    }

    return lines.length > 0 ? lines.join('\n') : 'New notification received';
  }
}
