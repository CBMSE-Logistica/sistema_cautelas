<script setup lang="ts">
import { ref, watch } from 'vue';
import { supabaseClient } from '../supabase/supabaseClient';
import { useBusca } from '../composables/useBusca';
import { useScrollLock } from '../composables/useScrollLock';
import type {
    Cautela,
    Pessoa,
    StatusCautela,
    StatusDisponibilidade,
    EstadoConservacao,
} from '../types';
import {
    X,
    CheckCircle2,
    Search,
    PackageCheck,
    Loader2,
    ArrowRight,
} from 'lucide-vue-next';

const props = defineProps<{
    estaAberto: boolean;
    fecharModal: () => void;
    cautela: Cautela | null;
}>();
const emit = defineEmits(['devolucao-salva']);

const carregando = ref(false);
const salvando = ref(false);

const listaBombeiros = ref<Pessoa[]>([]);
const bombeiroDevolucao = ref<Pessoa | null>(null);
const exibirBombeiroDrop = ref(false);

// Itens da Cautela (com estado mutável para o usuário selecionar)
interface ItemDevolucao {
    id_material: number;
    nome: string;
    numero_serie: string;
    estado_atual: EstadoConservacao; // O estado original
    estado_devolucao: EstadoConservacao; // O novo estado selecionado
}
const itensParaDevolver = ref<ItemDevolucao[]>([]);

const form = ref({
    observacoes: '',
});

// Opções do Dropdown de Estado (Espelho do ENUM do Banco)
const opcoesEstado: EstadoConservacao[] = [
    'NOVO',
    'BOM',
    'REGULAR',
    'RUIM',
    'INOPERAVEL',
];

// --- BUSCA DE BOMBEIROS (Quem devolveu) ---
const {
    termoBusca: queryBombeiro,
    resultados: filteredBombeiros,
} = useBusca(listaBombeiros, ['nome', 'matricula', 'graduacao']);

// --- CARREGAR DADOS ---
// Sempre que o modal abrir ou a Cautela mudar, carrega os detalhes
watch(
    () => props.cautela,
    async (novaCautela) => {
        if (novaCautela && props.estaAberto) {
            await prepararDados(novaCautela);
        }
    }
);

async function prepararDados(cautela: Cautela) {
    carregando.value = true;

    // 1. Carregar lista de bombeiros para o dropdown "Quem devolveu"
    const { data: pessoas } = await supabaseClient
        .from('pessoa')
        .select('*')
        .order('nome');
    if (pessoas) listaBombeiros.value = pessoas;

    // 2. Pré-selecionar o responsável original como quem está devolvendo (padrão)
    if (cautela.responsavel) {
        setBombeiro(cautela.responsavel);
    }

    // 3. Buscar os ITENS dessa cautela específica
    const { data: itens } = await supabaseClient
        .from('item_cautela')
        .select(
            `
      material:fk_id_material (
        id_material, nome, numero_serie, estado_conservacao
      )
    `
        )
        .eq('fk_id_cautela', cautela.id_cautela);

    if (itens) {
        itensParaDevolver.value = itens.map((i: any) => ({
            id_material: i.material.id_material,
            nome: i.material.nome,
            numero_serie: i.material.numero_serie,
            estado_atual: i.material.estado_conservacao,
            estado_devolucao: i.material.estado_conservacao, // Usuário pode mudar isso
        }));
    }

    carregando.value = false;
}

// --- AÇÕES UI ---
function setBombeiro(b: Pessoa) {
    bombeiroDevolucao.value = b;
    queryBombeiro.value = `${b.graduacao} ${b.nome}`;
    exibirBombeiroDrop.value = false;
}

function fecharComDelay() {
    setTimeout(() => {
        exibirBombeiroDrop.value = false;
    }, 200);
}

// --- SALVAR DEVOLUÇÃO ---
async function confirmarDevolucao() {
    if (!props.cautela) return;
    if (!bombeiroDevolucao.value)
        return alert('Informe quem está devolvendo o material.');

    salvando.value = true;

    try {
        // 1. REGISTRAR NA TABELA DEVOLUCAO
        const { error: erroDev } = await supabaseClient
            .from('devolucao')
            .insert({
                fk_id_cautela: props.cautela.id_cautela,
                fk_id_pessoa_devolveu: bombeiroDevolucao.value.id_pessoa,
                data_hora_devolucao: new Date().toISOString(), // Agora
                condicao_devolucao: 'BOM', // Valor genérico obrigatório, os detalhes estão nos itens
                observacoes: form.value.observacoes,
            });

        if (erroDev) throw erroDev;

        // 2. ATUALIZAR STATUS DA CAUTELA -> FINALIZADA
        const statusFinalizada: StatusCautela = 'FINALIZADA';
        const { error: erroCautela } = await supabaseClient
            .from('cautela')
            .update({ status: statusFinalizada })
            .eq('id_cautela', props.cautela.id_cautela);

        if (erroCautela) throw erroCautela;

        // 3. ATUALIZAR CADA MATERIAL (Loop)
        for (const item of itensParaDevolver.value) {
            let novoStatus: StatusDisponibilidade = 'DISPONIVEL';

            // Regra de Negócio: Se voltou RUIM ou INOPERAVEL, vai para manutenção
            if (
                item.estado_devolucao === 'RUIM' ||
                item.estado_devolucao === 'INOPERAVEL'
            ) {
                novoStatus = 'MANUTENCAO';
            }

            await supabaseClient
                .from('material')
                .update({
                    estado_conservacao: item.estado_devolucao, // Atualiza se quebrou
                    status: novoStatus, // Libera ou Bloqueia
                })
                .eq('id_material', item.id_material);
        }

        alert('Devolução registrada com sucesso!');
        props.fecharModal();
        emit('devolucao-salva'); // Manda sinal para atualizar a lista
        window.location.reload();
    } catch (error: any) {
        console.error('Erro ao devolver:', error);
        alert('Erro: ' + error.message);
    } finally {
        salvando.value = false;
    }
}

useScrollLock(() => props.estaAberto);
</script>

<template>
    <div
        v-if="estaAberto"
        class="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-sm transition-opacity"
    >
        <div
            class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in scroll"
        >
            <div
                class="flex items-center justify-between p-6 border-b border-gray-100 shrink-0 bg-gray-50/50"
            >
                <div class="flex items-center gap-3">
                    <div class="bg-green-100 p-2 rounded-lg">
                        <PackageCheck class="w-6 h-6 text-green-700" />
                    </div>
                    <div>
                        <h2 class="text-xl font-bold text-gray-800">
                            Registrar Devolução
                        </h2>
                        <p class="text-xs text-gray-500" v-if="cautela">
                            Referente à Cautela #{{ cautela.id_cautela }}
                        </p>
                    </div>
                </div>
                <button
                    @click="fecharModal"
                    class="text-gray-400 hover:text-red-600 transition p-1 hover:bg-red-50 rounded-full"
                >
                    <X class="w-6 h-6" />
                </button>
            </div>

            <div v-if="carregando" class="p-10 text-center text-gray-400">
                <Loader2
                    class="w-8 h-8 text-green-600 animate-spin mx-auto mb-3"
                />
                <p>Carregando itens da cautela...</p>
            </div>

            <div
                v-else
                class="p-6 overflow-y-auto flex-1 space-y-8 scrollbar-thin"
            >
                <div class="relative z-30">
                    <label class="block text-sm font-bold text-gray-800 mb-2"
                        >Quem está devolvendo?</label
                    >
                    <div class="relative">
                        <Search
                            class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                        />

                        <input
                            type="text"
                            v-model="queryBombeiro"
                            @focus="exibirBombeiroDrop = true"
                            @blur="fecharComDelay"
                            placeholder="Busque pelo nome..."
                            class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-600/20 focus:border-green-600 outline-none transition text-sm text-gray-800"
                        />

                        <div
                            v-if="
                                bombeiroDevolucao &&
                                queryBombeiro.includes(bombeiroDevolucao.nome)
                            "
                            class="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 flex items-center gap-1 text-xs font-bold bg-green-50 px-2 py-1 rounded-md border border-green-100"
                        >
                            <CheckCircle2 class="w-3 h-3" /> Confirmado
                        </div>

                        <div
                            v-if="
                                exibirBombeiroDrop && filteredBombeiros.length
                            "
                            class="absolute z-20 mt-1 w-full bg-white shadow-xl border border-gray-100 rounded-xl max-h-48 overflow-auto"
                        >
                            <button
                                v-for="b in filteredBombeiros"
                                :key="b.id_pessoa"
                                @click="setBombeiro(b)"
                                class="w-full text-left px-4 py-3 hover:bg-gray-50 flex flex-col border-b last:border-0 border-gray-50 transition"
                            >
                                <span class="font-bold text-gray-800 text-sm"
                                    >{{ b.graduacao }} {{ b.nome }}</span
                                >
                                <span class="text-xs text-gray-400"
                                    >Mat: {{ b.matricula }}</span
                                >
                            </button>
                        </div>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-800 mb-3"
                        >Conferência de Equipamentos</label
                    >

                    <div class="space-y-3">
                        <div
                            v-for="item in itensParaDevolver"
                            :key="item.id_material"
                            class="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm gap-4"
                            :class="{
                                'border-red-300 bg-red-50':
                                    item.estado_devolucao === 'RUIM' ||
                                    item.estado_devolucao === 'INOPERAVEL',
                            }"
                        >
                            <div class="flex items-center gap-3">
                                <div
                                    class="bg-gray-100 p-2 rounded-lg text-gray-500 font-mono text-xs font-bold"
                                >
                                    #{{ item.numero_serie }}
                                </div>
                                <div>
                                    <p class="font-bold text-gray-800 text-sm">
                                        {{ item.nome }}
                                    </p>
                                    <p class="text-xs text-gray-400">
                                        Saiu como: {{ item.estado_atual }}
                                    </p>
                                </div>
                            </div>

                            <div
                                class="flex items-center gap-3 w-full sm:w-auto"
                            >
                                <ArrowRight
                                    class="hidden sm:block w-4 h-4 text-gray-300"
                                />

                                <div class="flex-1 sm:flex-none">
                                    <label
                                        class="block text-[10px] font-bold text-gray-400 uppercase mb-1 sm:hidden"
                                        >Estado na Devolução</label
                                    >
                                    <select
                                        v-model="item.estado_devolucao"
                                        class="w-full sm:w-40 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                                        :class="{
                                            'text-green-700 bg-green-50 border-green-200':
                                                item.estado_devolucao ===
                                                    'BOM' ||
                                                item.estado_devolucao ===
                                                    'NOVO',
                                            'text-red-700 bg-red-50 border-red-200':
                                                item.estado_devolucao ===
                                                    'RUIM' ||
                                                item.estado_devolucao ===
                                                    'INOPERAVEL',
                                        }"
                                    >
                                        <option
                                            v-for="opt in opcoesEstado"
                                            :value="opt"
                                        >
                                            {{ opt }}
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-800 mb-2"
                        >Observações Gerais</label
                    >
                    <textarea
                        v-model="form.observacoes"
                        rows="2"
                        class="w-full p-3 text-gray-800 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm resize-none focus:border-green-600 focus:ring-2 focus:ring-green-600/10 transition"
                        placeholder="Alguma avaria? Algum detalhe da missão?"
                    ></textarea>
                </div>
            </div>

            <div
                class="p-5 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-end gap-3"
            >
                <button
                    @click="fecharModal"
                    class="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition text-sm"
                    :disabled="salvando"
                >
                    Cancelar
                </button>
                <button
                    @click="confirmarDevolucao"
                    :disabled="salvando"
                    class="px-5 py-2.5 rounded-xl font-bold text-white bg-green-700 hover:bg-green-800 transition shadow-lg shadow-green-700/20 active:scale-95 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Loader2 v-if="salvando" class="w-4 h-4 animate-spin" />
                    {{ salvando ? 'Processando...' : 'Confirmar Devolução' }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
@keyframes scale-in {
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}
.animate-scale-in {
    animation: scale-in 0.2s ease-out;
}
</style>
