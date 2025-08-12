import { Router } from 'express'
import { serveImageController, serveVideoStreamController } from '~/controllers/medias.controllers'

const assetsRouter = Router()

// MEMO: View a specific image at: `/assets/images/file-name`
assetsRouter.get('/images/:name', serveImageController)

// MEMO: View a specific video at: `/assets/video-stream/file-name`
assetsRouter.get('/video-stream/:name', serveVideoStreamController)

export default assetsRouter
