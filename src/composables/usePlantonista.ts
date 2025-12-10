import { ref } from 'vue'
import type { Pessoa } from '../types'

// Estado Global 
const plantonistaAtual = ref<Pessoa | null>(null)

export function usePlantonista() {
  
  // Salva no LocalStorage para não perder se der F5
  const definirPlantonista = (p: Pessoa) => {
    plantonistaAtual.value = p
    localStorage.setItem('plantonista_ativo', JSON.stringify(p))
  }

  // Recupera ao abrir o site
  const recuperarPlantonista = () => {
    const salvo = localStorage.getItem('plantonista_ativo')
    if (salvo) {
      try {
        plantonistaAtual.value = JSON.parse(salvo)
      } catch {
        plantonistaAtual.value = null
      }
    }
  }

  return {
    plantonistaAtual,
    definirPlantonista,
    recuperarPlantonista
  }
}