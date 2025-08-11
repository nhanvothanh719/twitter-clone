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
