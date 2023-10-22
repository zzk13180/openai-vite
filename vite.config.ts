import { defineConfig, loadEnv } from 'vite'
import { HttpsProxyAgent } from 'https-proxy-agent'

// 加载环境变量，前缀为 OPENAI_
const env = loadEnv('', process.cwd(), 'OPENAI_')

// 配置 HTTP 代理（如果系统环境变量中有设置）
const httpProxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY
const agent = httpProxy ? new HttpsProxyAgent(httpProxy) : undefined

// 构建请求头，包含 API Key
const headers: Record<string, string> = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
}

// 如果有组织 ID，也添加到请求头中
if (env.OPENAI_ORG_ID) {
  headers['OpenAI-Organization'] = env.OPENAI_ORG_ID
}

// 配置代理规则
const proxy = {
  '/v1': {
    target: env.OPENAI_BASE_URL, // 目标 API 地址
    changeOrigin: true, // 修改 Host 头
    agent, // 使用代理代理（如果存在）
    headers, // 注入认证头
  },
}

export default defineConfig({
  server: {
    proxy,
  },
  envPrefix: 'OPENAI_', // 暴露给客户端的环境变量前缀
})
