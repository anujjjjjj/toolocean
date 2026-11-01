/**
 * Decides which page thumbnail is drawn next. Drawing itself is passed in, so this
 * stays free of pdf.js and canvas and runs under node --test.
 *
 * Pages are drawn newest request first: after a fast scroll the reader is looking
 * at what was asked for last. A page that scrolls away before it starts is dropped.
 * Each finished render gives the browser a macrotask before the next one starts.
 */
export interface ThumbnailQueueOptions<T> {
  concurrency: number;
  render: (index: number, signal: AbortSignal) => Promise<T>;
  onDone: (index: number, result: T) => void;
  onFail: (index: number) => void;
  /** Called when work starts or runs out. */
  onBusy?: (busy: boolean) => void;
}

export interface ThumbnailQueue {
  request: (index: number) => void;
  drop: (index: number) => void;
  destroy: () => void;
}

export function createThumbnailQueue<T>(options: ThumbnailQueueOptions<T>): ThumbnailQueue {
  const { concurrency, render, onDone, onFail, onBusy } = options;
  const controller = new AbortController();
  const waiting: number[] = [];
  const claimed = new Set<number>();
  let running = 0;
  let scheduled = false;
  let busy = false;

  const report = () => {
    const next = running > 0 || waiting.length > 0;
    if (next === busy) return;
    busy = next;
    onBusy?.(next);
  };

  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    setTimeout(pump, 0);
  };

  function pump() {
    scheduled = false;
    if (controller.signal.aborted) return;
    while (running < concurrency && waiting.length > 0) {
      const index = waiting.pop() as number;
      claimed.add(index);
      running += 1;
      render(index, controller.signal)
        .then(
          (result) => {
            if (!controller.signal.aborted) onDone(index, result);
          },
          () => {
            if (!controller.signal.aborted) onFail(index);
          },
        )
        .finally(() => {
          running -= 1;
          if (controller.signal.aborted) return;
          report();
          schedule();
        });
    }
  }

  return {
    request(index) {
      if (controller.signal.aborted || claimed.has(index)) return;
      const at = waiting.indexOf(index);
      if (at !== -1) waiting.splice(at, 1);
      waiting.push(index);
      report();
      schedule();
    },
    drop(index) {
      const at = waiting.indexOf(index);
      if (at === -1) return;
      waiting.splice(at, 1);
      report();
    },
    destroy() {
      waiting.length = 0;
      controller.abort();
    },
  };
}
