import { Request, Response } from 'express'
import { HTTP_STATUS } from '~/constants/httpStatuses'
import { USER_MESSAGE } from '~/constants/messages'
import { UPLOAD_IMG_FOLDER_PATH, UPLOAD_VIDEO_FOLDER_PATH } from '~/constants/paths'
import mediasService from '~/services/medias.services'
import fs from 'fs'
import mime from 'mime'

export const uploadImagesController = async (req: Request, res: Response) => {
  const result = await mediasService.uploadImages(req)
  return res.json({
    message: USER_MESSAGE.IMG_UPLOAD_SUCCESS,
    result
  })
}

export const serveImageController = (req: Request, res: Response) => {
  const { name } = req.params
  return res.sendFile(`${UPLOAD_IMG_FOLDER_PATH}/${name}`, (err) => {
    if (err) {
      res.status(HTTP_STATUS.NOT_FOUND).send(USER_MESSAGE.IMG_NOT_FOUND)
    }
  })
}

export const uploadVideoController = async (req: Request, res: Response) => {
  const result = await mediasService.uploadVideo(req)
  return res.json({
    message: USER_MESSAGE.VIDEO_UPLOAD_SUCCESS,
    result
  })
}

export const serveVideoStreamController = async (req: Request, res: Response) => {
  const range = req.headers.range
  if (!range) {
    return res.status(HTTP_STATUS.BAD_REQUEST).send('Range header is required')
  }

  // MEMO: Get file name
  const { name } = req.params
  const videoPath = `${UPLOAD_VIDEO_FOLDER_PATH}/${name}`

  // MEMO: 1MB = 10^6 bytes (Tính theo hệ thập phân -> Thứ thường thấy trên UI)
  // MEMO: 1MB = 2^20 bytes = 1024 * 1024 (Tính theo hệ nhị phân)
  // Calculate size of video (bytes)
  const videoSize = fs.statSync(videoPath).size
  // Dung lượng video cho mỗi phân đoạn stream
  const chunkSize = 10 ** 6 // 1MB = 10^6 bytes

  // Lấy giá trị byte bắt đầu từ Header Range (vd: bytes=1048576~)
  const start = Number(range.replace(/\D/g, ''))
  // Lấy giá trị byte kết thúc (nếu vượt quá dung lượng của video thì sẽ lấy giá trị của video size)
  const end = Math.min(start + chunkSize, videoSize)
  // Dung lượng thực tế cho mỗi đoạn video stream (thường đây sẽ là chunkSize, ngoại trừ giá trị cuối cùng)
  const contentLength = end - start // end = Math.min(start + chunkSize, videoSize)

  const contentType = mime.getType(videoPath) || 'video/*'
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType
  }
  res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers)
  const videoStream = fs.createReadStream(videoPath, { start, end })
  videoStream.pipe(res)
}
