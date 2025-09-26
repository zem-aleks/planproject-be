import { Observable } from 'rxjs';
import { NEW_LINE } from '../../../shared/utils/variables';
import { Readable } from 'stream';
import { ChatChunkStreamResponse } from '../types/stream';

export const decodeStreamIntoObserver = (
  stream: Readable,
  extractDeltaContent: (dataString: string) => string | null,
): Observable<ChatChunkStreamResponse> => {
  const decoder = new TextDecoder('utf-8');
  return new Observable((observer) => {
    stream.on('data', (data: BufferSource) => {
      const chunkString = decoder.decode(data);

      // perplexity doesn't provide valid json, even the structure looks similar. Regex is used
      const content = extractDeltaContent(chunkString) ?? '';

      // new lines symbols come inside the response
      const cleanedContent = content.replaceAll(/\\n/g, NEW_LINE);
      observer.next({ content: cleanedContent, type: 'chunk' });
    });

    stream.on('end', () => {
      observer.complete();
    });

    stream.on('error', (error) => {
      observer.error(error);
    });
  });
};
