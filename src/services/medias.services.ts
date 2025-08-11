import { Request } from 'express'
import { deleteFile, getNameFromFullName, uploadTemporaryImages } from '~/utils/file'
import sharp from 'sharp'
import { UPLOAD_FOLDER_PATH } from '~/constants/paths'
import path from 'path'
import { config } from 'dotenv'
import { isProduction } from '~/constants/config'
import { MediaType } from '~/constants/enums'
import { Media } from '~/models/Others'

config()

class MediasService {
  async uploadImages(req: Request) {
    const files = await uploadTemporaryImages(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const imgName = getNameFromFullName(file.newFilename)
        const uploadPath = `${UPLOAD_FOLDER_PATH}/${imgName}.jpg`
        // Save new `.jpeg` image in `/uploads` folder after modification
        await sharp(file.filepath).jpeg().toFile(uploadPath)
        // Remove temporary image in `/uploads/temp` folder
        deleteFile(file.filepath)
        const host = isProduction ? (process.env.HOST as string) : `http://localhost:${process.env.PORT}`
        return {
          url: `${host}/assets/images/${imgName}.jpg`,
          type: MediaType.Image
        }
      })
    )
    return result
  }
}

const mediasService = new MediasService()
export default mediasService
