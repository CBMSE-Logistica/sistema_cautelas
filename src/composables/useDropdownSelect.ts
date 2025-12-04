// src/composables/useDropdownSelect.ts
import { ref, type Ref } from 'vue'
import { useBusca } from './useBusca'

/**
 * Composable para gerenciar a lógica de Dropdowns com busca (Combobox).
 * * @param listaDados Ref para a lista completa de dados (ex: listaBombeiros)
 * @param chavesBusca Array de strings para o Fuse.js (ex: ['nome', 'matricula'])
 * @param formatarLabel Função que transforma o item em string para o input após seleção
 */
export function useDropdownSelect<T>(
  listaDados: Ref<T[]>,
  chavesBusca: string[],
  formatarLabel: (item: T) => string
) {
  // 1. Reutiliza o useBusca internamente para filtrar a lista
  const { termoBusca, resultados, estaBuscando } = useBusca(listaDados, chavesBusca)

  // 2. Estados de Controle de UI
  const estaAberto = ref(false)
  const itemSelecionado = ref<T | null>(null) as Ref<T | null>

  // 3. Ações Padronizadas

  // Abre a lista ao focar no input
  const abrir = () => {
    estaAberto.value = true
  }

  // Fecha com delay para dar tempo do click no botão ser registrado antes do blur
  const fecharComDelay = () => {
    setTimeout(() => {
      estaAberto.value = false
    }, 200)
  }

  // Seleciona um item da lista
  const selecionar = (item: T) => {
    itemSelecionado.value = item
    // Atualiza o texto do input com a formatação visual desejada
    termoBusca.value = formatarLabel(item)
    estaAberto.value = false
  }

  // Reseta o estado (usado ao limpar o formulário)
  const limpar = () => {
    itemSelecionado.value = null
    termoBusca.value = ''
    estaAberto.value = false
  }

  // Define o termo manualmente (opcional)
  const setTermo = (valor: string) => {
    termoBusca.value = valor
    // Se o usuário limpar o texto na mão, desmarca o item
    if (valor === '') {
        itemSelecionado.value = null
    }
  }

  return {
    // Dados Reativos
    termoBusca,      // Ligue no v-model do input
    resultados,      // Ligue no v-for da lista
    itemSelecionado, // Use para pegar o ID ao salvar
    
    // Estados
    estaBuscando,    // Para mostrar spinner de loading
    estaAberto,      // Para mostrar/esconder a div da lista

    // Ações
    abrir,           // Ligue no @focus
    fecharComDelay,  // Ligue no @blur
    selecionar,      // Ligue no @click do item da lista
    limpar,          // Use ao resetar formulário
    setTermo
  }
}