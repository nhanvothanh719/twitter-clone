import { Request } from 'express'
import { deleteFile, getNameFromFullName, uploadTemporaryImages, uploadVideoHandler } from '~/utils/file'
import sharp from 'sharp'
import { UPLOAD_IMG_FOLDER_PATH } from '~/constants/paths'
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
        const uploadPath = `${UPLOAD_IMG_FOLDER_PATH}/${imgName}.jpg`
        // Save new `.jpeg` image in `/uploads/images` folder after modification
        await sharp(file.filepath).jpeg().toFile(uploadPath)
        // Remove temporary image in `/uploads/images/temp` folder
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

  async uploadVideo(req: Request) {
    const file = await uploadVideoHandler(req)
    const { newFilename } = file
    const host = isProduction ? (process.env.HOST as string) : `http://localhost:${process.env.PORT}`
    return {
      url: `${host}/assets/videos/${newFilename}`,
      type: MediaType.Video
    }
  }
}

const mediasService = new MediasService()
export default mediasService
