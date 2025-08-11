import { Request } from 'express'
import formidable, { File } from 'formidable'
import fs from 'fs'
import { USER_MESSAGE } from '~/constants/messages'
import {
  TEMP_UPLOAD_IMG_FOLDER_PATH,
  TEMP_UPLOAD_VIDEO_FOLDER_PATH,
  UPLOAD_IMG_FOLDER_PATH,
  UPLOAD_VIDEO_FOLDER_PATH
} from '~/constants/paths'

export const initFolder = () => {
  const checkedPaths = [TEMP_UPLOAD_IMG_FOLDER_PATH, TEMP_UPLOAD_VIDEO_FOLDER_PATH]
  checkedPaths.forEach((path) => {
    if (!fs.existsSync(path)) {
      // MEMO: Allow to create nested folder (ex: /uploads/imgs, ...)
      fs.mkdirSync(path, { recursive: true })
    }
  })
}

export const uploadTemporaryImages = async (req: Request) => {
  const MAX_FILE_NUMBER = 4
  const maxFileSize = 300 * 1024 // MEMO: Max size of each uploaded file is 300KB
  const maxTotalFileSize = MAX_FILE_NUMBER * 300 * 1024
  const form = formidable({
    uploadDir: TEMP_UPLOAD_IMG_FOLDER_PATH,
    maxFiles: MAX_FILE_NUMBER,
    keepExtensions: true,
    maxFileSize,
    maxTotalFileSize,
    filter: function ({ name, originalFilename, mimetype }) {
      const isValidName = name === 'images' // MEMO: req.body.images
      const isValidMimeType = (mimetype as string).includes('image/')
      const isValid = isValidName && isValidMimeType
      if (!isValid) {
        form.emit('error' as any, new Error(USER_MESSAGE.UPLOADED_FILE_TYPE_INVALID) as any)
      }
      return isValid
    }
  })
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      // MEMO: If error occurs
      if (err) return reject(err)
      // MEMO: If successfully upload
      resolve(files.images as File[]) // MEMO: `images` is a field in request body
    })
  })
}

export const uploadVideoHandler = (req: Request) => {
  const MAX_FILE_NUMBER = 1
  const maxFileSize = 100 * 1024 * 1024 // MEMO: Max size of each uploaded file is 100MB
  const form = formidable({
    uploadDir: UPLOAD_VIDEO_FOLDER_PATH,
    maxFiles: MAX_FILE_NUMBER,
    keepExtensions: true,
    maxFileSize,
    filter: function ({ name, originalFilename, mimetype }) {
      const isValidName = name === 'videos' // MEMO: req.body.videos
      const isValidMimeType = (mimetype as string).includes('mp4') || (mimetype as string).includes('quicktime')
      const isValid = isValidName && isValidMimeType
      if (!isValid) {
        form.emit('error' as any, new Error(USER_MESSAGE.UPLOADED_FILE_TYPE_INVALID) as any)
      }
      return isValid
    }
  })
  return new Promise<File>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      // MEMO: If error occurs
      if (err) return reject(err)
      // MEMO: If successfully upload
      resolve((files.videos as File[])[0]) // MEMO: `videos` is a field in request body
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
