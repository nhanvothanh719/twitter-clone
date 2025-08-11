import { Router } from 'express'
import { uploadSingleImgController } from '~/controllers/medias.controllers'

const mediasRouter = Router()

mediasRouter.post('/upload-image', uploadSingleImgController)
export default mediasRouter
