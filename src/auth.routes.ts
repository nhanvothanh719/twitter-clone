import express, { Request, Response, NextFunction } from 'express'
const checkedAuthRouter = express.Router()

// Defined middlewares
const checkAuth01 = (req: Request, res: Response, next: NextFunction) => {
  console.log('>>> Check authentication 001')
  next()
}
const checkAuth02 = (req: Request, res: Response, next: NextFunction) => {
  console.log('>>> Check authentication 002')
  next()
}
checkedAuthRouter.use(checkAuth01, checkAuth02)

checkedAuthRouter.get('/books', (req, res) =>
  res.json({
    data: [
      { id: 1, name: 'ABC' },
      { id: 2, name: 'DEF' }
    ]
  })
)
checkedAuthRouter.post('/authors', (req, res) => {
  res.status(500).send('Error in creating new author')
})

export default checkedAuthRouter
