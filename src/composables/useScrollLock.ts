import { watch, onUnmounted, type WatchSource } from 'vue'

/**
 * Trava o scroll do body quando a condição for verdadeira.
 * @param condition
 */
export function useScrollLock(condition: WatchSource<boolean>) {
  
  // Assiste a mudança da variável (estaAberto)
  watch(condition, (isLocked) => {
    if (isLocked) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
    }
  })

  // Destrava ao destruir o componente
  onUnmounted(() => {
    document.body.classList.remove('overflow-hidden')
  })
}