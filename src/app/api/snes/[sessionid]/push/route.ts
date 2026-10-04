import { handleControllerPush } from '@/lib/retro/push'

export const runtime = 'nodejs'

export async function POST(req: Request, { params }: any) {
  const { sessionid } = await params
  return handleControllerPush(req, 'snes', sessionid)
}
