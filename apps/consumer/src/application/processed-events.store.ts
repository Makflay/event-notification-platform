import { Injectable } from '@nestjs/common';

@Injectable()
export class ProcessedEventsStore {
  private readonly processdEventsIds = new Set<string>();

  has(eventId: string): boolean {
    return this.processdEventsIds.has(eventId);
  }

  add(eventId: string): void {
    this.processdEventsIds.add(eventId);
  }
}
