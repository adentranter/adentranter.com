import { createUploadthing, type FileRouter } from "uploadthing/next"
import { UploadThingError } from "uploadthing/server"

import {
  getUploadSessionFromRequest,
  verifyUploadSession,
} from "@/lib/upload-auth"

const f = createUploadthing()

export const ourFileRouter = {
  anyUploader: f({
    blob: {
      maxFileSize: "512MB",
      maxFileCount: 20,
    },
  })
    .middleware(async ({ req }) => {
      const session = getUploadSessionFromRequest(req)
      if (!verifyUploadSession(session)) {
        throw new UploadThingError("Unauthorized")
      }

      return { uploadedAt: new Date().toISOString() }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        url: file.ufsUrl,
        name: file.name,
        size: file.size,
        uploadedAt: metadata.uploadedAt,
      }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
