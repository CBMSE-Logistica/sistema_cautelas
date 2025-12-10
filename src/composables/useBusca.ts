import { ref, computed, type Ref } from 'vue'

/**
 * Remove acentos e deixa minúsculo para comparação justa.
 * Ex: "João" -> "joao"
 */
function normalizarTexto(valor: any): string {
    if (!valor) return ''
    return String(valor)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
}

export function useBusca<T>(listaOriginal: Ref<T[]>, chaves: (keyof T)[]) {
    
    const termoBusca = ref('')

    const resultados = computed(() => {
        // 1. Se não tiver termo digitado, retorna a lista completa
        if (!termoBusca.value.trim()) {
            return listaOriginal.value
        }

        const termoNormalizado = normalizarTexto(termoBusca.value)

        // 2. Algoritmo de Busca Linear (Filter)
        return listaOriginal.value.filter(item => {
            // Verifica se ALGUMA das chaves (ex: nome, matricula) contém o termo
            return chaves.some(chave => {
                const valorItem = item[chave]
                const valorNormalizado = normalizarTexto(valorItem)
                
                return valorNormalizado.includes(termoNormalizado)
            })
        })
    })

    return {
        termoBusca,
        resultados,
    }
}