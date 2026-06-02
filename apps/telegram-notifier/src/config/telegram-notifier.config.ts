import { registerAs } from '@nestjs/config';
import { validateTelegramNotifierEnv } from './telegram-notifier-env.validation';

export default registerAs('telegramNotifier', () => {
  const env = validateTelegramNotifierEnv(process.env);

  return {
    port: env.TELEGRAM_NOTIFIER_PORT,
    telegram: {
      botToken: env.TELEGRAM_BOT_TOKEN,
      chatId: env.TELEGRAM_CHAT_ID,
    },
  };
});
