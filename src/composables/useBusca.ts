import { ref, watch, type Ref } from 'vue';
import { fuzzySearch } from '../utils/busca';
import { debounce } from '../utils/debounce';

// Define o que o nosso Composable retorna para o componente
interface UseBuscaResultado<T> {
    termoBusca: Ref<string>; // Termo de busca
    resultados: Ref<T[]>; // Lista de resultados
    estaBuscando: Ref<boolean>; // Útil para mostrar um "carregando..."
}

export function useBusca<T>(
    dadosIniciais: Ref<T[]> | T[], // Aceita tanto um ref quanto um array puro
    chaves: string[],
    atraso = 300
): UseBuscaResultado<T> {
    // Normaliza para garantir que estamos lidando com um Ref
    const data = ref(dadosIniciais) as Ref<T[]>;

    // Estado
    const termoBusca = ref('');
    const resultados = ref<T[]>(data.value) as Ref<T[]>; // Começa com a lista completa
    const estaBuscando = ref(false);

    // A função de busca "pesada" que será executada após o atraso
    const realizarBusca = (termo: string) => {
        resultados.value = fuzzySearch(data.value, termo, chaves);
        estaBuscando.value = false;
    };

    // Cria a versão "debounced" da busca
    const debouncedSearch = debounce(realizarBusca, atraso);

    // Observa o que o usuário digita
    watch(termoBusca, (novoTermo) => {
        estaBuscando.value = true; // Ativa o loading imediatamente ao digitar
        debouncedSearch(novoTermo); // Agenda a busca
    });

    // Opcional: Se a lista original mudar (ex: API retornou novos dados), atualizamos a busca
    watch(data, () => {
        realizarBusca(termoBusca.value);
    });

    return {
        termoBusca,
        resultados,
        estaBuscando,
    };
}
