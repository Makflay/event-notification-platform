export type EventDto = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
};
