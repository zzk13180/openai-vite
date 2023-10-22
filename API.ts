import type OpenAI from 'openai'

export class API {
  readonly BASE_URL = '/v1/'
  readonly METHOD = 'POST'
  readonly CACHE = 'no-store'
  readonly CREDENTIALS = 'include'
  constructor(private headers: Record<string, string> = {}) {}

  async chat(params: OpenAI.Chat.ChatCompletionCreateParams): Promise<Response> {
    const response = await this.request('chat/completions', params)
    return response
  }

  static async *readStream(stream: ReadableStream) {
    const reader = stream.getReader()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          return
        }
        yield API.parseChunk2Completion(value)
      }
    } finally {
      reader.releaseLock()
    }
  }

  static parseChunk2Completion(chunk: Uint8Array): OpenAI.ChatCompletionChunk[] {
    const decoder = new TextDecoder()
    const str = decoder.decode(chunk)
    const result = str
      .split('\n')
      .map(line => {
        line = line.trim()
        const pos = line.indexOf(':')
        const key = line.substring(0, pos)
        const value = line.substring(pos + 1).trim()
        if (key !== 'data' || !value || value === '[DONE]') {
          return null
        }
        try {
          return JSON.parse(value)
        } catch (e) {
          console.error(e)
          return null
        }
      })
      .filter(Boolean)
    return result as OpenAI.ChatCompletionChunk[]
  }

  private async request(
    path: string,
    params: OpenAI.Chat.ChatCompletionCreateParams,
  ): Promise<Response> {
    const response = await fetch(`${this.BASE_URL}${path}`, {
      body: JSON.stringify({ ...params, stream: true }),
      cache: this.CACHE,
      credentials: this.CREDENTIALS,
      method: this.METHOD,
      headers: this.headers,
    })

    if (!response.ok && response.body) {
      try {
        const body = await response.clone().json()
        const init = {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        }
        return new Response(body, init)
      } catch (e) {
        console.error(e)
      }
    }

    if (response.status === 204) {
      const body = null
      const init = {
        status: 204,
        statusText: response.statusText,
        headers: response.headers,
      }
      return new Response(body, init)
    }

    const body = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader()
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            controller.close()
            break
          }
          controller.enqueue(value)
        }
      },
    })

    const init = {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    }
    return new Response(body, init)
  }
}
