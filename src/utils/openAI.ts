import { createParser, ParsedEvent, ReconnectInterval } from 'eventsource-parser'
import type { ChatMessage } from '@/types'

export const generatePayload = (apiKey: string, messages: ChatMessage[]): RequestInit => ({
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
    'Access-Control-Allow-Origin':'*',
    'Access-Control-Allow-Credentials':'true'
  },
  method: 'POST',
  body: JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages,
    temperature: 0.6,
    stream: true
  }),
})

export const parseOpenAIStream = (rawResponse: Response) => {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const stream = new ReadableStream({
     start(controller) {
      // const streamParser = (event: ParsedEvent | ReconnectInterval) => {
      //   if (event.type === 'event') {
      //     const data = event.data
      //     if (data === '[DONE]') {
      //       controller.close()
      //       return
      //     }
      //     try {
      //       // response = {
      //       //   id: 'chatcmpl-6pULPSegWhFgi0XQ1DtgA3zTa1WR6',
      //       //   object: 'chat.completion.chunk',
      //       //   created: 1677729391,
      //       //   model: 'gpt-3.5-turbo-0301',
      //       //   choices: [
      //       //     { delta: { content: '你' }, index: 0, finish_reason: null }
      //       //   ],
      //       // }
      //       const json = JSON.parse(data)
      //       const text = json.choices[0].delta?.content || ''
      //       const queue = encoder.encode(text)
      //       controller.enqueue(queue)
      //     } catch (e) {
      //       controller.error(e)
      //     }
      //   }
      // }

      // const parser = createParser(streamParser)
      // for (const chunk of rawResponse.body as any) {
      //   parser.feed(decoder.decode(chunk))
      // }

      
      async function push() {
        try {
        // let json = await rawResponse.json();
        const reader = rawResponse.body.getReader();
        let tempStr;
        reader.read().then(function processResult(result) {
          if (result.done) {
            controller.close()
            console.log('Stream complete');
            return;
          }
          const chunk = decoder.decode(result.value, {stream: true});
          let arr = chunk.split("\n\n");
          // 处理响应数据
          for (let ll of arr) {
            if (!tempStr) {
              ll = ll+tempStr;
              tempStr = undefined;
            }
           
            const substr = ll.slice(6);
            if ('[DONE]' !== substr && '' !== substr ) {
                try {
                  let json = JSON.parse(substr);
                  const text = json.choices[0].delta?.content || ''
                  console.log(text);
                  const queue = encoder.encode(text)
                  controller.enqueue(queue)
                } catch (error) {
                  console.log("截断的文本"+ll);
                  tempStr = ll;
                }
               
            } 
          }
          reader.read().then(processResult);
        });
        // "done" is a Boolean and value a "Uint8Array"
        // const text = json.choices[0].message?.content || ''
        // const queue = encoder.encode(text)
        // controller.enqueue(queue)
       } catch (e) {
        controller.error(e)
       }
      }
      push();
    },
  })
  return stream
}
export const realPassword = import.meta.env.SITE_PASSWORD
  
 