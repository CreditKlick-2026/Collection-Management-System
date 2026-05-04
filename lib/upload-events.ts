import { EventEmitter } from 'events';

/**
 * Process-level singleton EventEmitter.
 * Worker Thread sends messages → route.ts receives via worker.on('message')
 *   → emits here → SSE stream endpoint subscribes → client gets real-time push.
 */
class UploadEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(200);
  }
}

const uploadEventBus = new UploadEventBus();

/**
 * In-memory store for skipped records per job.
 * Key: jobId, Value: array of { account_no, name, reason }
 * Auto-cleaned when client fetches with ?clear=true or after 1 hour.
 */
export const skippedStore = new Map<string, { account_no: string; name: string; reason: string }[]>();

export default uploadEventBus;
