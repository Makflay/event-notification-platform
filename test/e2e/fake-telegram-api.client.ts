import { Injectable } from '@nestjs/common';

@Injectable()
export class FakeTelegramApiClient {
  readonly sentMessages: string[] = [];

  sendMessage(text: string): Promise<void> {
    this.sentMessages.push(text);

    return Promise.resolve();
  }

  clear(): void {
    this.sentMessages.length = 0;
  }
}
