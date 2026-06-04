async function main() {
  const { syncEssaysFromFiles } = await import("../src/lib/essays-sync")
  const summary = await syncEssaysFromFiles()
  console.log("Sync complete:", summary)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
