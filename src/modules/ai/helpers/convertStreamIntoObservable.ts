import { Observable } from 'rxjs';
import { ChatCompletionChunk } from 'openai/resources';
import { ChatChunkStreamResponse } from '../types/stream';

export const convertStreamIntoObservable = (
  stream: ReadableStream<any>,
): Observable<ChatChunkStreamResponse> => {
  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8');
  return new Observable((observer) => {
    const read = () => {
      reader
        .read()
        .then(({ done, value }) => {
          if (done) {
            console.log('done');
            observer.complete();
          } else {
            const chunk: ChatCompletionChunk = JSON.parse(
              decoder.decode(value),
            );

            observer.next({
              content: chunk.choices[0].delta.content || '',
              type: 'chunk',
            });
            read();
          }
        })
        .catch((error) => {
          observer.error(error);
        });
    };

    read();

    // Cleanup logic in case of unsubscription
    return () => reader.cancel();
  });
};
