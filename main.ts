import './style.css'
import { API } from './API'
import type OpenAI from 'openai'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="container">
    <button id="start" type="button">Send 🌟</button>
    <p class="item"></p>
  </div>
`

const prompt = (text: string) =>
  `Translate the following text into ${targetLanguage},\n\n${text}\n\n\nTranslated into ${targetLanguage}:`

const prompt_system =
  'As a multilingual translation assistant, Your task is to complete the translation tasks of the application I18n. Please provide accurate and fluent translations to ensure that the original text is transformed into an equivalent expression appropriate to the target language and culture. You can use appropriate terminology and grammar to ensure the accuracy and professionalism of the translation.Please note that you should be able to translate multiple languages and provide flexible and creative translations as needed. Your translation should accurately convey the meaning of the original text and meet the requirements of the target language and culture.'

const text = 'ありがとうございます。' // Text to be translated
const targetLanguage = 'english'

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
  temperature: 0.5,
  max_tokens: 1024,
}

const item = document.querySelector<HTMLParagraphElement>('.item')!
const startButton = document.querySelector<HTMLButtonElement>('#start')!
const api = new API()

const start = async () => {
  const { body } = await api.chat(params)
  if (typeof body?.getReader === 'function') {
    for await (const completions of API.readStream(body)) {
      completions.forEach(({ choices }) => {
        const { delta } = choices[0]
        if (delta.content) {
          item.innerHTML += delta.content
        }
      })
    }
  } else {
    item.innerHTML = body ? JSON.stringify(body) : 'empty'
  }
}

startButton.addEventListener('click', () => {
  start()
})
