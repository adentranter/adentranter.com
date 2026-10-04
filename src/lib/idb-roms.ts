export type StoredRomMeta = {
  name: string
  size: number
  type: string
  addedAt: number
}

const STORE = 'files'

function openDB(dbName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName, 1)
    req.onerror = () => reject(req.error)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'name' })
        store.createIndex('addedAt', 'addedAt')
      }
    }
    req.onsuccess = () => resolve(req.result)
  })
}

export async function putRom(dbName: string, file: File): Promise<StoredRomMeta> {
  const db = await openDB(dbName)
  const data = await file.arrayBuffer()
  const meta: StoredRomMeta = {
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    addedAt: Date.now(),
  }
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    store.put({ ...meta, data })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
  db.close()
  return meta
}

export async function getRom(dbName: string, name: string): Promise<{ meta: StoredRomMeta; blob: Blob } | null> {
  const db = await openDB(dbName)
  const record = await new Promise<any>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const req = store.get(name)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
  db.close()
  if (!record) return null
  const { data, ...meta } = record
  return { meta, blob: new Blob([data], { type: record.type || 'application/octet-stream' }) }
}

export async function listRoms(dbName: string): Promise<StoredRomMeta[]> {
  const db = await openDB(dbName)
  const items = await new Promise<StoredRomMeta[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const req = store.getAll()
    req.onsuccess = () => {
      const res = (req.result || []).map((r: any) => ({
        name: r.name,
        size: r.size,
        type: r.type,
        addedAt: r.addedAt,
      }))
      resolve(res)
    }
    req.onerror = () => reject(req.error)
  })
  db.close()
  // Newest first
  return items.sort((a, b) => b.addedAt - a.addedAt)
}

export async function deleteRom(dbName: string, name: string): Promise<void> {
  const db = await openDB(dbName)
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    store.delete(name)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
  db.close()
}
