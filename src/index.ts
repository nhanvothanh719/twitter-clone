import express from 'express'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/errors.middlewares'
import mediasRouter from './routes/medias.routes'
import { initFolder } from './utils/file'
import { config } from 'dotenv'
import { UPLOAD_VIDEO_FOLDER_PATH } from './constants/paths'
import assetsRouter from './routes/assets.routes'
import tweetsRouter from './routes/tweets.routes'
import bookmarksRouter from './routes/bookmarks.routes'

config()
const app = express()
const port = process.env.PORT || 3000

initFolder()
// MEMO: View uploaded videos at: `/assets-videos/file-name`
app.use('/assets-videos', express.static(UPLOAD_VIDEO_FOLDER_PATH))
databaseService
  .checkDBConnection()
  .then(() => {
    databaseService.addIndexToUsersCollection()
    databaseService.addIndexToRefreshTokensCollection()
    databaseService.addIndexToFollowersCollection()
  })
  .catch(console.dir)

// === Middleware setup ===
// - Must be registered before any route handlers
// MEMO: Middleware for converting JSON string to JavaScript Object
app.use(express.json())

// === Route handler ===
// - Any errors thrown here will be passed to the error handler bellow
app.use('/assets', assetsRouter)
app.use('/users', usersRouter)
app.use('/medias', mediasRouter)
app.use('/tweets', tweetsRouter)
app.use('/bookmarks', bookmarksRouter)

// === Error-handling middleware ===
// - Catch errors from all previous routes or middlewares
// MEMO: Default error handler => Handle errors in the request handler
app.use(defaultErrorHandler)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
