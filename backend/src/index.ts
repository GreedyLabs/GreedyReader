import 'dotenv/config'
import { createApp } from './app.js'

const PORT = Number(process.env.PORT ?? 8000)

const app = createApp()

app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`)
  console.log(`   Health: http://localhost:${PORT}/health`)
  console.log(`   Books:  http://localhost:${PORT}/api/v1/books`)
  console.log(`   AI:     http://localhost:${PORT}/api/v1/ai`)
})
