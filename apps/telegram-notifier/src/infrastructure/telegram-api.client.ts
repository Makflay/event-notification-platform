import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramApiError } from './telegram-api.error';

interface TelegramApiErrorResponse {
  ok: false;
  error_code: number;
  description: string;
}

@Injectable()
export class TelegramApiClient {
  private readonly logger = new Logger(TelegramApiClient.name);
  private readonly requestTimeoutMs = 10 * 1000;

  constructor(private readonly configService: ConfigService) {}

  async sendMessage(text: string): Promise<void> {
    const botToken = this.configService.getOrThrow<string>(
      'telegramNotifier.telegram.botToken',
    );
    const chatId = this.configService.getOrThrow<string>(
      'telegramNotifier.telegram.chatId',
    );

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const abortController = new AbortController();
    const timeout = setTimeout(
      () => abortController.abort(),
      this.requestTimeoutMs,
    );

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
        await this.handleTelegramErrorRes(res);
      }

      this.logger.log('Telegram message sent successfully');
    } catch (error) {
      if (error instanceof TelegramApiError) {
        throw error;
      }

      if (error instanceof Error && error.message === 'AbortError') {
        this.logger.error('Telegram API request timeout');

        throw new TelegramApiError(
          'Telegram API request timeout',
          'TELEGRAM_TIMEOUT_ERROR',
        );
      }

      this.logger.error(
        'Telegram API network error',
        error instanceof Error ? error.stack : undefined,
      );

      throw new TelegramApiError(
        'Telegram API network error',
        'TELEGRAM_NETWORK_ERROR',
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private async handleTelegramErrorRes(res: Response): Promise<never> {
    const resBody = (await res
      .json()
      .catch(() => null)) as TelegramApiErrorResponse | null;

    const description = resBody?.description ?? 'Unknown Telegram API error';

    if (res.status === 401) {
      this.logger.error('Telegram API rejected bot token');

      throw new TelegramApiError(
        'Invalid Telegram bot token',
        'INVALID_BOT_TOKEN',
        res.status,
      );
    }

    if (
      res.status === 400 &&
      description.toLowerCase().includes('chat not found')
    ) {
      this.logger.error('Telegram API rejected chat id');
      throw new TelegramApiError(
        'Invalid Telegram chat id',
        'INVALID_CHAT_ID',
        res.status,
      );
    }
    this.logger.error(
      `Telegram API error: status=${res.status}, description=${description}`,
    );

    throw new TelegramApiError(description, 'TELEGRAM_API_ERROR', res.status);
  }
}
