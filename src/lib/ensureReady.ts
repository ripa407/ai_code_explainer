import { connectDB } from './db';
import { bootstrapSuperAdmin } from '../utils/bootstrapSuperAdmin';

let ready: Promise<void> | null = null;

export function ensureReady(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await connectDB();
      await bootstrapSuperAdmin();
    })();
  }

  return ready;
}
