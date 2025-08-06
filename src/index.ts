import express from 'express'
import checkedAuthRouter from './auth.routes'
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app
  .route('/users')
  .get((req, res) => res.send('>>> Get list users'))
  .post((req, res) => res.send('>>> Create new user'))

app.use('/auth', checkedAuthRouter)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
