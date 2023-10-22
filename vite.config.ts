import { defineConfig, loadEnv } from 'vite'
import type { HttpProxy } from 'vite'
import type * as http from 'node:http'

const env = loadEnv('', process.cwd(), 'OPENAI_')

const proxy = {
  '/v1': {
    target: env.OPENAI_BASE_URL,
    changeOrigin: true,
    configure: (proxy: HttpProxy.Server) => {
      proxy.on('proxyReq', (proxyReq: http.ClientRequest) => {
        proxyReq.setHeader('Content-Type', 'application/json')
        proxyReq.setHeader('Authorization', `Bearer ${env.OPENAI_API_KEY}`)
        if (env.OPENAI_ORG_ID) {
          proxyReq.setHeader('OpenAI-Organization', env.OPENAI_ORG_ID)
        }
      })
    },
  },
}

export default defineConfig({
  server: {
    proxy,
  },
  envPrefix: 'OPENAI_',
})
