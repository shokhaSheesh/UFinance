import { queryClient } from '@/lib/queryClient'

// Полная очистка данных сайта — аналог DevTools → Application → Clear site data.
// Вызывается при выходе, чтобы после смены пользователя не осталось ничего от
// предыдущей сессии: кеш React Query, localStorage, sessionStorage, cookies,
// IndexedDB (в т.ч. базы Firebase) и Cache Storage.

// Не все браузеры поддерживают indexedDB.databases() (напр. Firefox) — для них
// удаляем известные базы Firebase по именам.
const FIREBASE_IDB_FALLBACK = [
  'firebase-installations-database',
  'firebase-heartbeat-database',
  'firebase-app-check-database',
  'firebaseLocalStorageDb',
]

const deleteIndexedDb = (name) =>
  new Promise((resolve) => {
    try {
      const request = indexedDB.deleteDatabase(name)
      // onblocked срабатывает, если база ещё открыта — считаем шаг завершённым,
      // удаление доедет после закрытия соединений (страница всё равно перезагрузится).
      request.onsuccess = request.onerror = request.onblocked = () => resolve()
    } catch {
      resolve()
    }
  })

export async function clearAllSiteData() {
  if (typeof window === 'undefined') return

  // 1. React Query — отменить активные запросы и очистить кеш в памяти
  try {
    queryClient.cancelQueries()
    queryClient.clear()
  } catch {}

  // 2. IndexedDB — удалить все базы
  try {
    const dbs =
      typeof indexedDB !== 'undefined' && indexedDB.databases
        ? await indexedDB.databases()
        : FIREBASE_IDB_FALLBACK.map((name) => ({ name }))
    await Promise.all(
      (dbs || [])
        .map((db) => db?.name)
        .filter(Boolean)
        .map(deleteIndexedDb)
    )
  } catch {}

  // 3. Cache Storage (service worker caches)
  try {
    if (window.caches?.keys) {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
    }
  } catch {}

  // 4. Cookies текущего домена
  try {
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim()
      if (!name) return
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    })
  } catch {}

  // 5. Web Storage — стираем последними, уже после всех await: так вычищаются и те
  // ключи, которые реакции mobx-persist могли переписать после сброса сторов.
  try {
    window.sessionStorage.clear()
  } catch {}
  try {
    window.localStorage.clear()
  } catch {}
}
