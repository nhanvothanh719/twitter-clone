import express from 'express'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/errors.middlewares'
import mediasRouter from './routes/medias.routes'
import { initFolder } from './utils/file'
import { config } from 'dotenv'
import { UPLOAD_IMG_FOLDER_PATH, UPLOAD_VIDEO_FOLDER_PATH } from './constants/paths'
import assetsRouter from './routes/assets.routes'

config()
const app = express()
const port = process.env.PORT || 3000

initFolder()
// MEMO: Enable this: View uploaded file at: `/assets/file-name.jpg`
// app.use('/assets', express.static(UPLOAD_IMG_FOLDER_PATH))
app.use('/assets-videos', express.static(UPLOAD_VIDEO_FOLDER_PATH))
databaseService.checkDBConnection().catch(console.dir)

// === Middleware setup ===
// - Must be registered before any route handlers
// MEMO: Middleware for converting JSON string to JavaScript Object
app.use(express.json())

// === Route handler ===
// - Any errors thrown here will be passed to the error handler bellow
app.use('/assets', assetsRouter)
app.use('/users', usersRouter)
app.use('/medias', mediasRouter)

// === Error-handling middleware ===
// - Catch errors from all previous routes or middlewares
// MEMO: Default error handler => Handle errors in the request handler
app.use(defaultErrorHandler)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
