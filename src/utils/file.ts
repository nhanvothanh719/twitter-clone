import { Request } from 'express'
import formidable, { File } from 'formidable'
import fs from 'fs'
import { TEMP_UPLOAD_FOLDER_PATH, UPLOAD_FOLDER_PATH } from '~/constants/paths'

export const initFolder = () => {
  if (!fs.existsSync(TEMP_UPLOAD_FOLDER_PATH)) {
    console.log('--- Folder for storing uploaded files cannot be found. Start to create it... ---')
    // MEMO: Allow to create nested folder (ex: /uploads/imgs, ...)
    fs.mkdirSync(TEMP_UPLOAD_FOLDER_PATH, { recursive: true })
    console.log('--- Create this folder successfully ---')
  }
}

export const handleTemporarySingleImageUpload = async (req: Request) => {
  const maxFileSize = 300 * 1024 // MEMO: Max file size is 300KB
  const form = formidable({
    uploadDir: TEMP_UPLOAD_FOLDER_PATH,
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
  return new Promise<File>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      // MEMO: If error occurs
      if (err) return reject(err)
      // MEMO: If successfully upload
      resolve((files.image as File[])[0])
    })
  })
}

export const getNameFromFullName = (fullName: string) => {
  const splittedFullname = fullName.split('.')
  // MEMO: Remove media file type (png, ...)
  splittedFullname.pop()
  return splittedFullname.join('')
}

export const deleteFile = (filePath: string) => {
  fs.unlinkSync(filePath)
}
