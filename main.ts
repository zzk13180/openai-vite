import './style.css'
import { API } from './API'
import type OpenAI from 'openai'

// 初始化页面结构
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="container">
    <button id="start" type="button">Send 🌟</button>
    <p class="item"></p>
  </div>
`

// 待翻译的文本和目标语言
const text = 'ありがとうございます。'
const targetLanguage = 'english'

// 构建用户提示词
const prompt = (text: string) =>
  `Translate the following text into ${targetLanguage},\n\n${text}\n\n\nTranslated into ${targetLanguage}:`

// 系统提示词，定义 AI 的角色和任务
const prompt_system =
  'As a multilingual translation assistant, Your task is to complete the translation tasks of the application I18n. Please provide accurate and fluent translations to ensure that the original text is transformed into an equivalent expression appropriate to the target language and culture. You can use appropriate terminology and grammar to ensure the accuracy and professionalism of the translation.Please note that you should be able to translate multiple languages and provide flexible and creative translations as needed. Your translation should accurately convey the meaning of the original text and meet the requirements of the target language and culture.'

// 聊天参数配置
const params: OpenAI.Chat.ChatCompletionCreateParams = {
  model: 'gpt-3.5-turbo',
  messages: [
    {
      role: 'system',
      content: prompt_system,
    },
    {
      role: 'user',
      content: prompt(text),
    },
  ],
  temperature: 0.5, // 随机性控制
  max_tokens: 1024, // 最大 token 数
}

// 获取 DOM 元素
const item = document.querySelector<HTMLParagraphElement>('.item')!
const startButton = document.querySelector<HTMLButtonElement>('#start')!
const api = new API()

// 开始翻译任务
const start = async () => {
  // 清空之前的输出
  item.innerHTML = ''
  
  // 发起请求
  const { body } = await api.chat(params)
  
  // 处理流式响应
  if (typeof body?.getReader === 'function') {
    for await (const completions of API.readStream(body)) {
      completions.forEach(({ choices }) => {
        const { delta } = choices[0]
        // 将增量内容追加到页面
        if (delta.content) {
          item.innerHTML += delta.content
        }
      })
    }
  } else {
    // 非流式响应处理
    item.innerHTML = body ? JSON.stringify(body) : 'empty'
  }
}

// 绑定点击事件
startButton.addEventListener('click', () => {
  start()
})
