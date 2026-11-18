import type { Draft } from './rules'

const DATABASE = 'character-forge'
const STORE = 'drafts'
let database: Promise<IDBDatabase> | undefined
function open() {
  if (!database) {
    database = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE, 1)
      request.onupgradeneeded = () => request.result.createObjectStore(STORE, {keyPath:'id'})
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    database.catch(() => { database = undefined })
  }
  return database
}
export async function loadDrafts() {
  const db = await open()
  return new Promise<Draft[]>((resolve,reject) => {
    const request = db.transaction(STORE).objectStore(STORE).getAll()
    request.onsuccess = () => resolve((request.result as Draft[]).filter(draft=>draft.schema===1).sort((a,b)=>b.updated-a.updated))
    request.onerror = () => reject(request.error)
  })
}
async function write(operation:(store:IDBObjectStore)=>void) {
  const db = await open()
  return new Promise<void>((resolve,reject) => {
    const transaction = db.transaction(STORE, 'readwrite')
    operation(transaction.objectStore(STORE))
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(transaction.error)
    transaction.onerror = () => reject(transaction.error)
  })
}
export const saveDraft = (draft:Draft) => write(store=>{store.put(draft)})
export const deleteDraft = (id:string) => write(store=>{store.delete(id)})
