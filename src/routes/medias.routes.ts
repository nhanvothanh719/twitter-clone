import { Router } from 'express'
import { uploadImagesController } from '~/controllers/medias.controllers'
import { wrapRequestHandler } from '~/utils/handlers'

const mediasRouter = Router()

mediasRouter.post('/upload-images', wrapRequestHandler(uploadImagesController))
export default mediasRouter
