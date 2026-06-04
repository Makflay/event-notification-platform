import { ProcessedEventsStore } from './processed-events.store';

describe('ProcessedEventsStore', () => {
  let store: ProcessedEventsStore;

  beforeEach(() => {
    store = new ProcessedEventsStore();
  });

  it('returns false for event that was not processed', () => {
    expect(store.has('event-id-1')).toBe(false);
  });

  it('returns true after event id is added', () => {
    store.add('event-id-1');

    expect(store.has('event-id-1')).toBe(true);
  });

  it('keeps different event ids independent', () => {
    store.add('event-id-1');

    expect(store.has('event-id-1')).toBe(true);
    expect(store.has('event-id-2')).toBe(false);
  });
});
