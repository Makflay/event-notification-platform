export type TelegramApiErrorCode =
  | 'INVALID_BOT_TOKEN'
  | 'INVALID_CHAT_ID'
  | 'TELEGRAM_API_ERROR'
  | 'TELEGRAM_NETWORK_ERROR'
  | 'TELEGRAM_TIMEOUT_ERROR';

export class TelegramApiError extends Error {
  constructor(
    message: string,
    readonly code: TelegramApiErrorCode,
    readonly statusCode?: number,
  ) {
    super(message);
  }
}
