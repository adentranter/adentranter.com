import CloneCountdown from "@/components/clone/clone-countdown"

export const dynamic = "force-dynamic"

export default function ClonePage() {
  return <CloneCountdown initialNowMs={Date.now()} />
}
