import { Request } from 'express'
import { deleteFile, getNameFromFullName, handleTemporarySingleImageUpload } from '~/utils/file'
import sharp from 'sharp'
import { UPLOAD_FOLDER_PATH } from '~/constants/paths'
import path from 'path'
import { config } from 'dotenv'
import { isProduction } from '~/constants/config'

config()

class MediasService {
  async handleUploadSingleImage(req: Request) {
    const file = await handleTemporarySingleImageUpload(req)
    const imgName = getNameFromFullName(file.newFilename)
    const uploadPath = `${UPLOAD_FOLDER_PATH}/${imgName}.jpg`
    // Save new image in `/uploads` folder after modification
    await sharp(file.filepath).jpeg().toFile(uploadPath)
    // Remove temporary image in `/uploads/temp` folder
    deleteFile(file.filepath)
    const host = isProduction ? (process.env.HOST as string) : `http://localhost:${process.env.PORT}`
    return `${host}/uploads/${imgName}.jpg`
  }
}

const mediasService = new MediasService()
export default mediasService
