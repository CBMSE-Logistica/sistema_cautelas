<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { supabaseClient } from '../supabase/supabaseClient';
import type { Cautela } from '../types';
import DevolucaoCautela from './DevolucaoCautela.vue';
import {
    Clock,
    Calendar,
    AlertTriangle,
    CheckCircle2,
    User,
    Package,
    ChevronRight,
    CornerDownRight,
    Search,
    Filter,
    ClipboardList
} from 'lucide-vue-next';

// --- ESTADOS ---
const carregando = ref(true);
const cautelas = ref<Cautela[]>([]);

// Novos Filtros
const filtroTexto = ref('');
const filtroStatus = ref('TODAS'); // Substitui o filtroAtivo por um select
const dataInicio = ref('');
const dataFim = ref('');

const modalDevolucaoAberto = ref(false);
const cautelaParaDevolver = ref<Cautela | null>(null);

// --- BUSCAR DADOS ---
async function carregarCautelas() {
    carregando.value = true;

    const { data, error } = await supabaseClient
        .from('cautela')
        .select(
            `
            id_cautela,
            data_hora_retirada,
            data_previsao_devolucao,
            status,
            created_at,
            pessoa:fk_id_pessoa_responsavel ( id_pessoa, nome, graduacao ),
            itens:item_cautela (quantidade_cautelada, 
                material:fk_id_material ( id_material, nome, numero_serie )
            ),
            devolucao (data_hora_devolucao)
        `
        )
        .order('data_previsao_devolucao', { ascending: true });

    if (error) {
        console.error('Erro ao buscar cautelas: ', error);
    } else {
        cautelas.value = (data || []).map((c: any) => ({
            id_cautela: c.id_cautela,
            data_hora_retirada: c.data_hora_retirada,
            data_previsao_devolucao: c.data_previsao_devolucao,
            status: c.status,
            motivo_cautela: c.motivo_cautela,
            plantonista_rto: c.plantonista_rto,
            responsavel: c.pessoa,
            created_at: c.created_at, // Importante para filtro de data
            data_devolucao_real: c.devolucao?.[0]?.data_hora_devolucao,
            itens: c.itens?.map((i: any) => ({
                ...i.material,
                quantidade_cautelada: i.quantidade_cautelada,
            })),
        }));
    }

    carregando.value = false;
}

defineExpose({carregarCautelas});

function abrirDevolucao(c: any) {
    cautelaParaDevolver.value = c;
    modalDevolucaoAberto.value = true;
}

function fecharDevolucao() {
    modalDevolucaoAberto.value = false;
    cautelaParaDevolver.value = null;
}

function onDevolucaoSalva() {
    carregarCautelas();
}

// --- UTILITÁRIOS ---
function formatarData(dataISO: string | undefined | null) {
    if (typeof dataISO !== 'string') return '--/--';
    const data = new Date(dataISO);
    if (!dataISO || isNaN(data.getTime())) return '--/--';
    return data.toLocaleDateString('pt-BR');
}

function isAtrasado(previsao: string) {
    const hoje = new Date();
    const dataPrev = new Date(previsao);
    hoje.setHours(0, 0, 0, 0);
    dataPrev.setHours(0, 0, 0, 0);
    return dataPrev < hoje;
}

function diasRestantes(previsao: string) {
    const diff = new Date(previsao).getTime() - new Date().getTime();
    const dias = Math.ceil(diff / (1000 * 3600 * 24));

    if (dias < 0) return `Atrasado há ${Math.abs(dias)} dias`;
    if (dias === 0) return 'Devolução Hoje';
    return `Vence em ${dias} dias`;
}

function getCorCartao(c: any) {
    if (c.status === 'FINALIZADA') return 'green';
    if (isAtrasado(c.data_previsao_devolucao)) return 'red';
    return 'blue';
}

// --- COMPUTED: FILTRO UNIFICADO ---
const cautelasFiltradas = computed(() => {
    return cautelas.value.filter((c) => {
        // 1. Filtro por Texto (Nome, Matrícula, Material, Série)
        const termo = filtroTexto.value.toLowerCase().trim();
        const matchTexto =
            !termo || // Se não tem termo, passa
            c.responsavel?.nome?.toLowerCase().includes(termo) ||
            c.responsavel?.graduacao?.toLowerCase().includes(termo) ||
            c.itens?.some(
                (i: any) =>
                    i.nome.toLowerCase().includes(termo) ||
                    i.numero_serie.toLowerCase().includes(termo)
            );

        // 2. Filtro por Status
        let matchStatus = true;
        const estaAtrasado = isAtrasado(c.data_previsao_devolucao);

        if (filtroStatus.value === 'ABERTA') {
            matchStatus = c.status === 'ABERTA' && !estaAtrasado; // Em dia
        } else if (filtroStatus.value === 'ATRASADA') {
            matchStatus =
                c.status === 'ATRASADA' ||
                (c.status === 'ABERTA' && estaAtrasado);
        } else if (filtroStatus.value === 'FINALIZADA') {
            matchStatus = c.status === 'FINALIZADA';
        }

        // 3. Filtro por Data
        let matchData = true;
        const dataRef = new Date(c.data_hora_retirada); // Ou created_at

        if (dataInicio.value) {
            const inicio = new Date(dataInicio.value);
            inicio.setHours(0, 0, 0, 0);
            matchData = matchData && dataRef >= inicio;
        }
        if (dataFim.value) {
            const fim = new Date(dataFim.value);
            fim.setHours(23, 59, 59, 999);
            matchData = matchData && dataRef <= fim;
        }

        return matchTexto && matchStatus && matchData;
    });
});

onMounted(() => {
    carregarCautelas();
});
</script>

<template>
    <div class="animate-fade-in pb-16">
        <div class="mb-6">
            <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
                <ClipboardList class="w-6 h-6 text-red-700" /> Histórico de
                Empréstimos
            </h2>
            <p class="text-sm text-gray-500">
                Consulte todas as movimentações de material
            </p>
        </div>

        <div
            class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6"
        >
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                <div class="relative">
                    <Search
                        class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    />
                    <input
                        v-model="filtroTexto"
                        type="text"
                        placeholder="Buscar militar ou item..."
                        class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-500 transition text-gray-700 placeholder-gray-400"
                    />
                </div>

                <div class="relative">
                    <Filter
                        class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    />
                    <select
                        v-model="filtroStatus"
                        class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-500 transition appearance-none cursor-pointer text-gray-700"
                    >
                        <option value="TODAS">Todos os Status</option>
                        <option value="ABERTA">Em Dia (Abertas)</option>
                        <option value="ATRASADA">Atrasadas</option>
                        <option value="FINALIZADA">
                            Finalizadas (Devolvidas)
                        </option>
                    </select>
                </div>

                <!-- <div class="relative">
                    <span
                        class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold"
                        >DE</span
                    >
                    <input
                        v-model="dataInicio"
                        type="date"
                        class="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-500 transition text-gray-600"
                    />
                </div>

                <div class="relative">
                    <span
                        class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold"
                        >ATÉ</span
                    >
                    <input
                        v-model="dataFim"
                        type="date"
                        class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-500 transition text-gray-600"
                    />
                </div> -->
            </div>
        </div>

        <div
            v-if="carregando"
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
            <div
                v-for="i in 3"
                :key="i"
                class="bg-white h-48 rounded-xl border border-gray-100 animate-pulse"
            ></div>
        </div>

        <div
            v-else-if="cautelasFiltradas.length === 0"
            class="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200"
        >
            <div
                class="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            >
                <Search class="w-8 h-8 text-gray-400" />
            </div>
            <h3 class="text-lg font-bold text-gray-700">
                Nenhuma cautela encontrada
            </h3>
            <p class="text-gray-400 text-sm">
                Tente ajustar os filtros de busca.
            </p>
        </div>

        <div
            v-else
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6"
        >
            <div
                v-for="c in cautelasFiltradas"
                :key="c.id_cautela"
                class="bg-white rounded-xl border shadow-sm transition hover:shadow-md group relative overflow-hidden flex flex-col"
                :class="{
                    'border-blue-200': getCorCartao(c) === 'blue',
                    'border-red-200': getCorCartao(c) === 'red',
                    'border-green-200': getCorCartao(c) === 'green',
                }"
            >
                <div
                    class="absolute left-0 top-0 bottom-0 w-1"
                    :class="{
                        'bg-blue-500': getCorCartao(c) === 'blue',
                        'bg-red-500': getCorCartao(c) === 'red',
                        'bg-green-500': getCorCartao(c) === 'green',
                    }"
                ></div>

                <div
                    class="flex flex-row p-5 pb-3 border-b border-gray-50 justify-between items-start pl-6"
                >
                    <div>
                        <div
                            class="flex items-center gap-2 text-gray-800 font-bold text-lg"
                        >
                            <User class="w-5 h-5 text-gray-400" />
                            {{ c.responsavel.graduacao }}
                            {{ c.responsavel.nome }}
                        </div>
                        <div class="text-xs text-gray-400 ml-7">
                            Protocolo #{{ c.id_cautela }}
                        </div>
                    </div>
                    <div
                        class="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"
                        :class="{
                            'bg-blue-50 text-blue-700':
                                getCorCartao(c) === 'blue',
                            'bg-red-50 text-red-700': getCorCartao(c) === 'red',
                            'bg-green-50 text-green-700':
                                getCorCartao(c) === 'green',
                        }"
                    >
                        <div
                            v-if="getCorCartao(c) === 'blue'"
                            class="flex gap-1 items-centers"
                        >
                            <Clock class="w-3 h-3 hidden md:block" />
                            {{ diasRestantes(c.data_previsao_devolucao) }}
                        </div>
                        <div
                            v-if="getCorCartao(c) === 'red'"
                            class="flex gap-1 items-centers"
                        >
                            <AlertTriangle class="w-3 h-3 hidden md:block" />
                            {{ diasRestantes(c.data_previsao_devolucao) }}
                        </div>
                        <div
                            v-if="getCorCartao(c) === 'green'"
                            class="flex gap-1 items-centers"
                        >
                            <CheckCircle2 class="w-3 h-3 hidden md:block" />
                            Concluído
                        </div>
                    </div>

                </div>

                <div class="p-5 pt-3 flex-1 pl-6">
                    <p
                        class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"
                    >
                        <Package class="w-3 h-3" /> Equipamentos Retirados:
                    </p>
                    <ul class="space-y-2">
                        <li
                            v-for="item in c.itens"
                            :key="item.id_material"
                            class="text-sm text-gray-700 flex items-start gap-2"
                        >
                            <CornerDownRight
                                class="w-4 h-4 text-gray-300 shrink-0 mt-0.5"
                            />
                            <div>
                                <span class="font-medium">{{ item.nome }}</span>
                                <span
                                    class="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded ml-2 font-mono"
                                >
                                    #{{ item.numero_serie }}
                                </span>
                            </div>
                        </li>
                    </ul>
                </div>

                <div
                    class="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between pl-6"
                >
                    <div class="text-xs text-gray-500">
                        <div class="flex items-center gap-1 mb-1">
                            <Calendar class="w-3 h-3" /> Retirada:
                            <b>{{ formatarData(c.data_hora_retirada) }}</b>
                        </div>
                        <div class="flex items-center gap-1">
                            <Calendar class="w-3 h-3" />
                            <span v-if="c.status === 'FINALIZADA'">
                                Entregue:
                                <b>{{ formatarData(c.data_devolucao_real) }}</b>
                            </span>
                            <span
                                v-else
                                :class="{
                                    'text-red-600 font-bold':
                                        getCorCartao(c) === 'red',
                                }"
                            >
                                Prevista:
                                {{ formatarData(c.data_previsao_devolucao) }}
                            </span>
                        </div>
                    </div>

                    <button
                        v-if="c.status !== 'FINALIZADA'"
                        @click="abrirDevolucao(c)"
                        class="bg-white border border-gray-200 text-gray-600 hover:text-green-700 hover:border-green-300 hover:bg-green-50 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1"
                        title="Registrar Devolução"
                    >
                        Devolver <ChevronRight class="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>

        <DevolucaoCautela
            :estaAberto="modalDevolucaoAberto"
            :fecharModal="fecharDevolucao"
            :cautela="cautelaParaDevolver"
            @devolucao-salva="onDevolucaoSalva"
        />
    </div>
</template>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.5s ease-out;
}
@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}
</style>
