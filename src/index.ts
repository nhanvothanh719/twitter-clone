import express from 'express'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/errors.middlewares'
const app = express()
const port = 3000

// MEMO: Same as: databaseService.checkDBConnection().catch(error => console.dir(error))
databaseService.checkDBConnection().catch(console.dir)

// === Middleware setup ===
// - Must be registered before any route handlers
// MEMO: Middleware for converting JSON string to JavaScript Object
app.use(express.json())

// === Route handler ===
// - Any errors thrown here will be passed to the error handler bellow
app.use('/users', usersRouter)

// === Error-handling middleware ===
// - Catch errors from all previous routes or middlewares
// MEMO: Default error handler => Handle errors in the request handler
app.use(defaultErrorHandler)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
