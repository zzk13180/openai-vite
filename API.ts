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

  /**
   * 用于处理 Server-Sent Events (SSE) 流。
   * @param stream 响应的 ReadableStream
   */
  static async *readStream(stream: ReadableStream) {
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          // 流结束时，处理剩余的 buffer
          if (buffer.trim()) {
            const results = API.parseBlock(buffer)
            if (results.length > 0) yield results
          }
          return
        }

        // 解码当前 chunk 并追加到 buffer
        buffer += decoder.decode(value, { stream: true })
        // 按行分割
        const lines = buffer.split('\n')
        // 最后一行可能不完整，保留在 buffer 中等待下一次拼接
        buffer = lines.pop() || ''

        const results: OpenAI.ChatCompletionChunk[] = []
        for (const line of lines) {
          const parsed = API.parseLine(line)
          if (parsed) results.push(parsed)
        }
        // 如果解析出有效数据，通过 yield 返回
        if (results.length > 0) yield results
      }
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * 解析文本块（通常用于处理流结束时的剩余数据）
   */
  static parseBlock(block: string): OpenAI.ChatCompletionChunk[] {
    return block
      .split('\n')
      .map(API.parseLine)
      .filter((x): x is OpenAI.ChatCompletionChunk => x !== null)
  }

  /**
   * 解析单行 SSE 数据
   * 格式通常为: "data: {...json...}"
   */
  static parseLine(line: string): OpenAI.ChatCompletionChunk | null {
    line = line.trim()
    // SSE 格式检查
    if (!line.startsWith('data:')) return null
    const value = line.substring(5).trim()
    // 忽略空行或结束标记
    if (!value || value === '[DONE]') return null

    try {
      return JSON.parse(value)
    } catch (e) {
      console.error('JSON parse error:', e)
      return null
    }
  }

  private async request(
    path: string,
    params: OpenAI.Chat.ChatCompletionCreateParams,
  ): Promise<Response> {
    // 强制开启流式传输 (stream: true)
    return fetch(`${this.BASE_URL}${path}`, {
      body: JSON.stringify({ ...params, stream: true }),
      cache: this.CACHE,
      credentials: this.CREDENTIALS,
      method: this.METHOD,
      headers: this.headers,
    })
  }
}
