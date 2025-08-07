import express from 'express'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'
const app = express()
const port = 3000

// MEMO: Middleware for converting JSON string to JavaScript Object
app.use(express.json())

app.use('/users', usersRouter)

// MEMO: Same as: databaseService.checkDBConnection().catch(error => console.dir(error))
databaseService.checkDBConnection().catch(console.dir)

// MEMO: Default error handler => Handle errors in the request handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.message)
  res.status(400).json({ error: err.message })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
