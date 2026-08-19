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

// Синхронная часть очистки: web storage и cookies. Вынесена отдельно, чтобы
// выход не зависел от асинхронных шагов (IndexedDB/Cache Storage) — они в
// некоторых браузерах и профилях зависают, и тогда logout «не срабатывал».
export function clearWebStorageSync() {
  if (typeof window === 'undefined') return
  try {
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim()
      if (!name) return
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    })
  } catch {}
  try {
    window.sessionStorage.clear()
  } catch {}
  try {
    window.localStorage.clear()
  } catch {}
}

// Ограничивает шаг очистки по времени: подвисший IndexedDB или Cache Storage
// не должен задерживать выход
const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(resolve, ms))])

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
        ? await withTimeout(indexedDB.databases(), 1500)
        : FIREBASE_IDB_FALLBACK.map((name) => ({ name }))
    await withTimeout(
      Promise.all(
        (dbs || [])
          .map((db) => db?.name)
          .filter(Boolean)
          .map(deleteIndexedDb)
      ),
      1500
    )
  } catch {}

  // 3. Cache Storage (service worker caches)
  try {
    if (window.caches?.keys) {
      const keys = (await withTimeout(caches.keys(), 1500)) || []
      await withTimeout(Promise.all(keys.map((key) => caches.delete(key))), 1500)
    }
  } catch {}

  // 4. Cookies и web storage — стираем последними, уже после всех await: так
  // вычищаются и те ключи, которые реакции mobx-persist могли переписать
  // после сброса сторов.
  clearWebStorageSync()
}
