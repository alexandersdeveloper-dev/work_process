import { useRef, useEffect } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(isOpen: boolean) {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!isOpen) return
    const el = ref.current
    if (!el) return

    const focusable = () =>
      Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (e) => !e.closest('[hidden]') && !e.closest('[aria-hidden="true"]')
      )

    const first = focusable()[0]
    if (first) first.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const elements = focusable()
      if (elements.length === 0) { e.preventDefault(); return }
      const firstEl = elements[0]
      const lastEl = elements[elements.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === firstEl) { e.preventDefault(); lastEl.focus() }
      } else {
        if (document.activeElement === lastEl) { e.preventDefault(); firstEl.focus() }
      }
    }

    el.addEventListener('keydown', onKeyDown)
    return () => el.removeEventListener('keydown', onKeyDown)
  }, [isOpen])

  return ref
}
