export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return
  }

  try {
    const { syncEssaysFromFiles } = await import("./lib/essays-sync")
    await syncEssaysFromFiles()
  } catch (error) {
    console.error("[instrumentation] essay sync failed", error)
  }
}
