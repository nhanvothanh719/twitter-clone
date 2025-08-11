import { Router } from 'express'
import { uploadImagesController, uploadVideoController } from '~/controllers/medias.controllers'
import { validateAccessToken, validateVerifiedUser } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const mediasRouter = Router()

mediasRouter.post(
  '/upload-images',
  validateAccessToken,
  validateVerifiedUser,
  wrapRequestHandler(uploadImagesController)
)

mediasRouter.post(
  '/upload-videos',
  validateAccessToken,
  validateVerifiedUser,
  wrapRequestHandler(uploadVideoController)
)

export default mediasRouter
