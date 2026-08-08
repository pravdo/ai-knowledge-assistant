import type { ChatStreamEvent } from '@ai-knowledge-assistant/contracts';

// One JSON object per line (§8.1, §Appendix A). The frontend buffers partial network chunks until
// a full line is available, so every write here must end with exactly one newline.
export function writeNdjsonEvent(stream: NodeJS.WritableStream, event: ChatStreamEvent): void {
  stream.write(`${JSON.stringify(event)}\n`);
}
