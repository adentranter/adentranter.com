import { cookies } from "next/headers"

import UploadClient from "@/components/upload/upload-client"
import {
  isUploadConfigured,
  UPLOAD_SESSION_COOKIE,
  verifyUploadSession,
} from "@/lib/upload-auth"

export default async function UploadPage() {
  const cookieStore = await cookies()
  const session = cookieStore.get(UPLOAD_SESSION_COOKIE)?.value
  const configured = isUploadConfigured() && Boolean(process.env.UPLOADTHING_TOKEN)

  return (
    <UploadClient
      authenticated={verifyUploadSession(session)}
      configured={configured}
    />
  )
}
