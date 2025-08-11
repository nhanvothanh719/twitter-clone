import { Request, Response } from 'express'
import formidable from 'formidable'
import path, { dirname } from 'path'
import { UPLOAD_FOLDER_PATH } from '~/constants/paths'
import { handleSingleImgUpload } from '~/utils/file'

export const uploadSingleImgController = async (req: Request, res: Response) => {
  const result = await handleSingleImgUpload(req)
  return res.json({
    result
  })
}
