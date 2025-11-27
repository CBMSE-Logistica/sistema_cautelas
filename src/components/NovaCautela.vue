<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { supabaseClient } from '../supabase/supabaseClient';
import { useBusca } from '../composables/useBusca';
import {
    X,
    ShieldAlert,
    Search,
    Calendar,
    User,
    Plus,
    Trash2,
} from 'lucide-vue-next';

// Props
const props = defineProps<{
    estaAberto: boolean;
    fecharModal: () => void;
}>();

// INTERFACES
interface Pessoa {
    id_pessoa: number;
    nome: string;
    matricula: string;
    graduacao: string;
    setor: string;
    contato: string;
}

interface Material {
    id_material: number;
    nome: string;
    numero_serie: string;
    estado_conservacao: string;
}

// --- ESTADOS ---
const carregando = ref(false);
const salvando = ref(false);

// Lista gerais
const listaBombeiros = ref<Pessoa[]>([]);
const listaMateriais = ref<Material[]>([]);

// Estados de UI (Dropdowns)
const exibirBombeiroDrop = ref(false);
const exibirMaterialDrop = ref(false);

// Lista de selecionados (Bombeiro e Equipamentos) na cautela
const bombeiroSelecionado = ref<Pessoa | null>(null);
const itensSelecionados = ref<Material[]>([]);

const {
    termoBusca: queryBombeiro, // Texto digitado pelo operador
    resultados: bombeirosFiltrados, // Lista filtrada
    estaBuscando: buscandoBombeiro,
} = useBusca(listaBombeiros, ['nome', 'matricula', 'graduacao']);

// Cria uma lista dinâmica sem os itens já selecionados
const materiaisDisponiveis = computed(() => {
    return listaMateriais.value.filter(
        (m) =>
            !itensSelecionados.value.find(
                (i) => i.id_material === m.id_material
            )
    );
});

const {
    termoBusca: queryMaterial,
    resultados: materiaisFiltrados,
    estaBuscando: buscandoMaterial,
} = useBusca(materiaisDisponiveis, ['nome', 'numero_serie']);

// Campos do formulário de cautela
const form = ref({
    dataDevolucao: '',
    plantonista: '',
    motivo: '',
    observacoes: '',
});

// --- CARREGAR DADOS ---
async function carregarDados() {
    carregando.value = true;

    const { data: pessoas } = await supabaseClient
        .from('pessoa')
        .select('id_pessoa, nome, matricula, graduacao')
        .order('nome');

    const { data: materiais } = await supabaseClient
        .from('material')
        .select('id_material, nome, numero_serie, estado_conservacao')
        .order('nome');

    if (pessoas) listaBombeiros.value = pessoas as Pessoa[];
    if (materiais) listaMateriais.value = materiais as Material[];

    carregando.value = false;
}

// --- AÇÕES ----
function setBombeiro(b: Pessoa) {
    bombeiroSelecionado.value = b;
    queryBombeiro.value = `${b.graduacao} ${b.nome}`;
    exibirBombeiroDrop.value = true;
}

function addMaterial(m: Material) {
    itensSelecionados.value.push(m);
    queryMaterial.value = ''; // Limpa busca
    exibirMaterialDrop.value = false; // Fecha dropdown
}

function removerMaterial(id: number) {
    itensSelecionados.value = itensSelecionados.value.filter(
        (i) => i.id_material !== id
    );
}

function fecharComDelay(tipo: 'bombeiro' | 'material') {
    setTimeout(() => {
        if (tipo === 'bombeiro') exibirBombeiroDrop.value = false;
        if (tipo === 'material') exibirMaterialDrop.value = false;
    }, 200);
}

async function confirmarCautela() {
    if (!bombeiroSelecionado.value) {
        return alert('Selecione um bombeiro responsável!');
    }

    if (itensSelecionados.value.length === 0) {
        return alert('Adicione pelo menos um equipamento.');
    }

    if (!form.value.dataDevolucao) {
        return alert('Informe a data prevista para devolução!');
    }

    salvando.value = true;

    try {
        const { data: cautelaCriada, error: erroCautela } = await supabaseClient
            .from('cautela')
            .insert({
                fk_id_pessoa_responsavel: bombeiroSelecionado.value.id_pessoa,
                plantonista_rto: form.value.plantonista,
                motivo_cautela: form.value.motivo,
                data_previsao_devolucao: form.value.dataDevolucao,
                status: 'ABERTA',
            })
            .select()
            .single();

        if (erroCautela) throw erroCautela;

        const itensParaInserir = itensSelecionados.value.map((item) => ({
            fk_id_cautela: cautelaCriada.id_cautela,
            fk_id_material: item.id_material,
            quantidade_cautelada: 1,
            /* VERIFICAR QUANTIDADE CAUTELADA
            DEVE SER POSSIVEL CAUTELAR MAIS DE UM EQUIPAMENTO IGUAL
            EX.: dois capacetes
            */
        }));

        const { error: erroItens } = await supabaseClient
            .from('item_cautela')
            .insert(itensParaInserir);

        if (erroItens) throw erroItens;

        alert(`Cautela #${cautelaCriada.id_cautela} gerada com sucesso!`);
        limparFormulario();
        props.fecharModal();
        window.location.reload();
    } catch (erro: any) {
        console.error('Erro ao salvar: ' + erro);
        alert('Erro ao realizar cautela' + erro.message);
    } finally {
        salvando.value = false;
    }
}

function limparFormulario() {
    bombeiroSelecionado.value = null;
    queryBombeiro.value = '';
    itensSelecionados.value = [];
    form.value = {
        dataDevolucao: '',
        plantonista: '',
        motivo: '',
        observacoes: '',
    };
}

onMounted(() => {
    carregarDados();
});
</script>

<template>
    <div
        v-if="estaAberto"
        class="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-sm transition-opacity"
    >
        <div
            class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in"
        >
            <div
                class="flex items-center justify-between p-6 border-b border-gray-100 shrink-0 bg-gray-50/50"
            >
                <div class="flex items-center gap-3">
                    <div class="bg-red-100 p-2 rounded-lg">
                        <ShieldAlert class="w-6 h-6 text-red-700" />
                    </div>
                    <div>
                        <h2 class="text-xl font-bold text-gray-800">
                            Nova Cautela
                        </h2>
                        <p class="text-xs text-gray-500">
                            Preencha os dados para registrar a saída
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
                    class="w-8 h-8 text-red-600 animate-spin mx-auto mb-3"
                />
                <p>Sincronizando banco de dados...</p>
            </div>

            <div
                v-else
                class="p-6 overflow-y-auto flex-1 space-y-6 scrollbar-thin"
            >
                <div class="relative z-30">
                    <label class="block text-sm font-bold text-gray-800 mb-2"
                        >Bombeiro Responsável
                        <span class="text-red-500">*</span></label
                    >
                    <div class="relative">
                        <div
                            v-if="buscandoBombeiro"
                            class="absolute left-4 top-1/2 -translate-y-1/2"
                        >
                            <Loader2
                                class="w-4 h-4 text-red-600 animate-spin"
                            />
                        </div>
                        <Search
                            v-else
                            class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                        />

                        <input
                            type="text"
                            v-model="queryBombeiro"
                            @focus="exibirBombeiroDrop = true"
                            @blur="fecharComDelay('bombeiro')"
                            placeholder="Busque por nome, matrícula ou patente..."
                            class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none transition text-sm text-gray-800"
                            :class="{
                                'border-red-600 bg-red-50':
                                    !bombeiroSelecionado &&
                                    queryBombeiro.length > 0 &&
                                    !exibirBombeiroDrop,
                            }"
                        />

                        <div
                            v-if="
                                bombeiroSelecionado &&
                                queryBombeiro.includes(bombeiroSelecionado.nome)
                            "
                            class="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 flex items-center gap-1 text-xs font-bold bg-green-50 px-2 py-1 rounded-md border border-green-100"
                        >
                            <CheckCircle2 class="w-3 h-3" /> Confirmado
                        </div>

                        <div
                            v-if="exibirBombeiroDrop && bombeirosFiltrados.length"
                            class="absolute z-20 mt-1 w-full bg-white shadow-xl border border-gray-100 rounded-xl max-h-48 overflow-auto"
                        >
                            <button
                                v-for="b in bombeirosFiltrados"
                                :key="b.id_pessoa"
                                @click="setBombeiro(b)"
                                class="w-full text-left px-4 py-3 hover:bg-gray-50 flex flex-col border-b last:border-0 border-gray-50 transition"
                            >
                                <span class="font-bold text-gray-800 text-sm"
                                    >{{ b.graduacao }} {{ b.nome }}</span
                                >
                                <span class="text-xs text-gray-400"
                                    >Matrícula: {{ b.matricula }}</span
                                >
                            </button>
                        </div>
                        <div
                            v-else-if="
                                exibirBombeiroDrop &&
                                queryBombeiro.length > 0 &&
                                !buscandoBombeiro
                            "
                            class="absolute z-20 mt-1 w-full bg-white shadow-xl border border-gray-100 rounded-xl p-4 text-center text-sm text-gray-500"
                        >
                            Nenhum militar encontrado.
                        </div>
                    </div>
                </div>

                <div class="relative z-20">
                    <label class="block text-sm font-bold text-gray-800 mb-2"
                        >Adicionar Equipamentos
                        <span class="text-red-500">*</span></label
                    >

                    <div class="relative mb-3">
                        <div
                            v-if="buscandoMaterial"
                            class="absolute left-4 top-1/2 -translate-y-1/2"
                        >
                            <Loader2
                                class="w-4 h-4 text-green-600 animate-spin"
                            />
                        </div>
                        <Plus
                            v-else
                            class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                        />

                        <input
                            id="input-material"
                            type="text"
                            v-model="queryMaterial"
                            @focus="exibirMaterialDrop = true"
                            @blur="fecharComDelay('material')"
                            placeholder="Digite o nome ou série do equipamento..."
                            class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition text-sm text-gray-800"
                        />

                        <div
                            v-if="exibirMaterialDrop && materiaisFiltrados.length"
                            class="absolute z-20 mt-1 w-full bg-white shadow-xl border border-gray-100 rounded-xl max-h-48 overflow-auto"
                        >
                            <button
                                v-for="m in materiaisFiltrados"
                                :key="m.id_material"
                                @click="addMaterial(m)"
                                class="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-0 border-gray-50 group transition flex justify-between items-center"
                            >
                                <div class="flex items-center gap-2">
                                    <span
                                        class="font-medium text-gray-800 text-sm"
                                        >{{ m.nome }}</span
                                    >
                                    <span
                                        class="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono"
                                        >#{{ m.numero_serie }}</span
                                    >
                                </div>

                                <span
                                    class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                    :class="{
                                        'bg-green-100 text-green-700':
                                            m.estado_conservacao === 'NOVO' ||
                                            m.estado_conservacao === 'BOM',
                                        'bg-yellow-100 text-yellow-700':
                                            m.estado_conservacao === 'REGULAR',
                                        'bg-red-100 text-red-700':
                                            m.estado_conservacao === 'RUIM' ||
                                            m.estado_conservacao ===
                                                'INSERVIVEL',
                                    }"
                                >
                                    {{ m.estado_conservacao }}
                                </span>
                            </button>
                        </div>
                        <div
                            v-else-if="
                                exibirMaterialDrop &&
                                queryMaterial.length > 0 &&
                                !buscandoMaterial
                            "
                            class="absolute z-20 mt-1 w-full bg-white shadow-xl border border-gray-100 rounded-xl p-4 text-center text-sm text-gray-500"
                        >
                            Item não encontrado ou já adicionado.
                        </div>
                    </div>

                    <div
                        class="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin"
                    >
                        <div
                            v-if="itensSelecionados.length === 0"
                            class="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50"
                        >
                            Nenhum item adicionado ainda.
                        </div>

                        <div
                            v-for="item in itensSelecionados"
                            :key="item.id_material"
                            class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-red-200 transition group animate-scale-in"
                        >
                            <div class="flex items-center gap-2">
                                <span class="font-bold text-gray-800 text-sm">{{
                                    item.nome
                                }}</span>
                                <span
                                    class="text-xs text-gray-400 font-mono tracking-wide"
                                    >#{{ item.numero_serie }}</span
                                >

                                <div
                                    v-if="
                                        item.estado_conservacao === 'RUIM' ||
                                        item.estado_conservacao === 'INSERVIVEL'
                                    "
                                    class="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded text-[10px] font-bold border border-red-100"
                                >
                                    <AlertTriangle class="w-3 h-3" />
                                    {{ item.estado_conservacao }}
                                </div>
                            </div>

                            <button
                                @click="removerMaterial(item.id_material)"
                                class="text-gray-300 hover:text-red-500 transition p-1 hover:bg-red-50 rounded"
                                title="Remover item"
                            >
                                <Trash2 class="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label
                            class="block text-sm font-bold text-gray-800 mb-2"
                            >Devolução Prevista
                            <span class="text-red-500">*</span></label
                        >
                        <div class="relative">
                            <Calendar
                                class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                            />
                            <input
                                type="date"
                                v-model="form.dataDevolucao"
                                class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm text-gray-800 focus:border-red-600 focus:ring-2 focus:ring-red-600/10 transition "
                            />
                        </div>
                    </div>
                    <div>
                        <label
                            class="block text-sm font-bold text-gray-800 mb-2"
                            >Plantonista</label
                        >
                        <div class="relative">
                            <User
                                class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                            />
                            <input
                                type="text"
                                v-model="form.plantonista"
                                placeholder="Seu nome"
                                class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:border-red-600 focus:ring-2 focus:ring-red-600/10 transition text-gray-800"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-800 mb-2"
                        >Motivo / Missão</label
                    >
                    <textarea
                        v-model="form.motivo"
                        rows="2"
                        class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm resize-none focus:border-red-600 focus:ring-2 focus:ring-red-600/10 transition text-gray-800"
                        placeholder="Ex: Ocorrência de incêndio florestal..."
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
                    @click="confirmarCautela"
                    :disabled="salvando"
                    class="px-5 py-2.5 rounded-xl font-bold text-white bg-green-700 hover:bg-green-800 transition shadow-lg shadow-green-700/20 active:scale-95 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span v-if="salvando" class="animate-spin">⏳</span>
                    {{ salvando ? 'Salvando...' : 'Confirmar Cautela' }}
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

.scrollbar-thin::-webkit-scrollbar {
    width: 6px;
    background: #f3f4f6; /* gray-100 */
}
.scrollbar-thin::-webkit-scrollbar-thumb {
    background: #9ca3af; /* gray-400 */
    border-radius: 8px;
}
.scrollbar-thin::-webkit-scrollbar-track {
    background: #f3f4f6; /* gray-100 */
}
</style>
