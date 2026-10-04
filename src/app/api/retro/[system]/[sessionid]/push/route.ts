import { handleControllerPush } from '@/lib/retro/push'
import { isRetroSystemId } from '@/lib/retro/systems'

export const runtime = 'nodejs'

export async function POST(req: Request, { params }: any) {
  const { system, sessionid } = await params
  if (!isRetroSystemId(system)) {
    return new Response('Unknown system', { status: 404 })
  }
  return handleControllerPush(req, system, sessionid)
}
