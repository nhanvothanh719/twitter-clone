import { Request } from 'express'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import { UPLOAD_FOLDER_PATH } from '~/constants/paths'

export const initFolder = () => {
  if (!fs.existsSync(UPLOAD_FOLDER_PATH)) {
    console.log('--- `/uploads` folder cannot be found. Start to create it... ---')
    // MEMO: Allow to create nested folder (ex: /uploads/imgs, ...)
    fs.mkdirSync(UPLOAD_FOLDER_PATH, { recursive: true })
    console.log('--- Create `/uploads` folder successfully ---')
  }
}

export const handleSingleImgUpload = async (req: Request) => {
  const maxFileSize = 300 * 1024 // MEMO: Max file size is 300KB
  const form = formidable({
    uploadDir: UPLOAD_FOLDER_PATH,
    maxFiles: 1,
    keepExtensions: true,
    maxFileSize,
    filter: function ({ name, originalFilename, mimetype }) {
      const isValidName = name === 'image' // MEMO: req.name === 'image'
      const isValidMimeType = (mimetype as string).includes('image/')
      const isValid = isValidName && isValidMimeType
      if (!isValid) {
        form.emit('error' as any, new Error('File type is invalid') as any)
      }
      return isValid
    }
  })
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      // MEMO: If error occurs
      if (err) return reject(err)
      // MEMO: If successfully upload
      resolve(files)
    })
  })
}
