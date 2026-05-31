import {
  Inject,
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RABBITMQ_CLIENT } from './rabbitmq.constants';

@Injectable()
export class RabbitMqConnection
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  constructor(
    @Inject(RABBITMQ_CLIENT)
    private readonly client: ClientProxy,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.client.connect();
  }

  onApplicationShutdown(): void {
    this.client.close();
  }
}
