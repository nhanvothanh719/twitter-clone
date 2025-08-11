import { Request, Response } from 'express'
import { HTTP_STATUS } from '~/constants/httpStatuses'
import { USER_MESSAGE } from '~/constants/messages'
import { UPLOAD_FOLDER_PATH } from '~/constants/paths'
import mediasService from '~/services/medias.services'

export const uploadSingleImgController = async (req: Request, res: Response) => {
  const result = await mediasService.handleUploadSingleImage(req)
  return res.json({
    message: USER_MESSAGE.IMG_UPLOAD_SUCCESS,
    result
  })
}

export const serveImageController = (req: Request, res: Response) => {
  const { name } = req.params
  return res.sendFile(`${UPLOAD_FOLDER_PATH}/${name}`, (err) => {
    if (err) {
      res.status(HTTP_STATUS.NOT_FOUND).send('Image is not found')
    }
  })
}
