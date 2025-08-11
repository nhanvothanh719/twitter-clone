import { Router } from 'express'
import { serveImageController, uploadSingleImgController } from '~/controllers/medias.controllers'

const assetsRouter = Router()

// MEMO: View image at: `/assets/images/file-name`
assetsRouter.get('/images/:name', serveImageController)

export default assetsRouter
