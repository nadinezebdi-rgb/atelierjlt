'use client'

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react'

const UnsavedContext = createContext(null)
const MESSAGE = 'Des modifications ne sont pas enregistrées. Quitter sans enregistrer ?'

export function UnsavedChangesProvider({ children }) {
  const changes = useRef(new Set())
  const register = useCallback((id, dirty) => {
    if (dirty) changes.current.add(id)
    else changes.current.delete(id)
  }, [])
  const confirmNavigation = useCallback(() => changes.current.size === 0 || window.confirm(MESSAGE), [])

  useEffect(() => {
    const warn = (event) => {
      if (!changes.current.size) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])

  return <UnsavedContext.Provider value={{ register, confirmNavigation }}>{children}</UnsavedContext.Provider>
}

export function useUnsavedChanges(dirty) {
  const id = useId()
  const context = useContext(UnsavedContext)
  const register = context?.register
  useEffect(() => {
    register?.(id, dirty)
    return () => register?.(id, false)
  }, [id, dirty, register])
  return () => !dirty || window.confirm(MESSAGE)
}

export function useAdminNavigation() {
  return useContext(UnsavedContext).confirmNavigation
}

export function useFormChanges(value) {
  const [saved, setSaved] = useState(null)
  useEffect(() => {
    if (value !== null && saved === null) setSaved(JSON.stringify(value))
  }, [value, saved])
  const dirty = saved !== null && JSON.stringify(value) !== saved
  const confirmDiscard = useUnsavedChanges(dirty)
  return { dirty, confirmDiscard, restore: () => JSON.parse(saved), markSaved: (next = value) => setSaved(JSON.stringify(next)) }
}
