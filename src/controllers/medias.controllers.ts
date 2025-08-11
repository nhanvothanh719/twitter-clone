import { Request, Response } from 'express'
import { USER_MESSAGE } from '~/constants/messages'
import mediasService from '~/services/medias.services'

export const uploadSingleImgController = async (req: Request, res: Response) => {
  const result = await mediasService.handleUploadSingleImage(req)
  return res.json({
    message: USER_MESSAGE.IMG_UPLOAD_SUCCESS,
    result
  })
}
