import { z } from 'zod';

const portSchema =
  process.env.NODE_ENV === 'test'
    ? z.coerce.number().int().nonnegative()
    : z.coerce.number().int().positive();

const telegramNotifierEnvSchema = z.object({
  TELEGRAM_NOTIFIER_PORT: portSchema.default(3002),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_CHAT_ID: z.string().min(1),
});

export function validateTelegramNotifierEnv(config: Record<string, unknown>) {
  const result = telegramNotifierEnvSchema.safeParse(config);

  if (!result.success) {
    throw new Error(
      `Telegram notifier environment validation failed: ${result.error.message}`,
    );
  }

  return result.data;
}
