import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramApiClient {
  private readonly logger = new Logger(TelegramApiClient.name);
  constructor(private readonly configService: ConfigService) {}

  async sendMessage(text: string): Promise<void> {
    const botToken = this.configService.getOrThrow<string>(
      'telegramNotifier.telegram.botToken',
    );
    const chatId = this.configService.getOrThrow<string>(
      'telegramNotifier.telegram.chatId',
    );

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
        }),
      });

      if (!res.ok) {
        const resBody = await res.text();

        throw new Error(
          `Telegram API request failed: status=${res.status}, body=${resBody}`,
        );
      }

      this.logger.log('Telegram message sent successfully');
    } catch (error) {
      this.logger.error(
        'Failed to send Telegram message',
        error instanceof Error ? error.stack : undefined,
      );

      throw error;
    }
  }
}
