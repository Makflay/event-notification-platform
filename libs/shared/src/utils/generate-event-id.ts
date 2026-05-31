import { v4 as uuidv4 } from 'uuid';

export function generateEventId(): string {
  return uuidv4();
}
