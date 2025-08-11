import { Request, Response } from 'express'
import formidable from 'formidable'
import path, { dirname } from 'path'
import { UPLOAD_FOLDER_PATH } from '~/constants/paths'

export const uploadSingleImgController = async (req: Request, res: Response) => {
  const maxFileSize = 300 * 1024 // MEMO: Max file size is 300KB
  const form = formidable({ uploadDir: UPLOAD_FOLDER_PATH, maxFiles: 1, keepExtensions: true, maxFileSize })
  form.parse(req, (err, fields, files) => {
    // MEMO: If error occurs
    if (err) throw err
    // MEMO: If successfully upload
    res.json({
      message: 'Update img successfully 001'
    })
  })
}
