import { Router } from 'express'
import { serveImageController, serveVideoController } from '~/controllers/medias.controllers'

const assetsRouter = Router()

// MEMO: View a specific image at: `/assets/images/file-name`
assetsRouter.get('/images/:name', serveImageController)

// MEMO: View a specific video at: `/assets/videos/file-name`
assetsRouter.get('/videos/:name', serveVideoController)

export default assetsRouter
