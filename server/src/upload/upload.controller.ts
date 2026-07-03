import { Controller, Post, UploadedFile, UseInterceptors, HttpCode } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { S3Storage } from 'coze-coding-dev-sdk'

const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
})

@Controller('upload-image')
export class UploadController {
  @Post()
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    console.log('图片上传请求 - 文件名:', file.originalname, '大小:', file.buffer.length, '类型:', file.mimetype)

    if (!file || !file.buffer) {
      return { code: 400, msg: '文件为空', data: null }
    }

    // 上传到对象存储
    const fileKey = await storage.uploadFile({
      fileContent: file.buffer,
      fileName: `chat-images/${Date.now()}_${file.originalname}`,
      contentType: file.mimetype || 'image/jpeg',
    })
    console.log('图片上传到 TOS, key:', fileKey)

    // 生成可访问的签名 URL（有效期 1 小时）
    const url = await storage.generatePresignedUrl({ key: fileKey, expireTime: 3600 })
    console.log('图片签名 URL 已生成')

    return { code: 200, msg: 'success', data: { key: fileKey, url } }
  }
}
