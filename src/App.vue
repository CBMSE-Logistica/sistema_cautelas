<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive } from 'vue';
import { supabaseClient } from './supabase/supabaseClient';
import NovaCautela from './components/NovaCautela.vue';
import ListaCautelas from './components/ListaCautelas.vue';
//import Login from './components/Login.vue';
import Inventario from './components/Inventario.vue';
import ListaBombeiros from './components/ListaBombeiros.vue';
import { usePlantonista } from './composables/usePlantonista';
import { useDropdownSelect } from './composables/useDropdownSelect';
import type { Pessoa } from './types';
import {
    Plus,
    LayoutGrid,
    ClipboardList,
    LogOut,
    Users,
    UserCog,
    ChevronDown,
} from 'lucide-vue-next';

// Estado de sessão
const sessao = ref<any>(null);
const usuarioEmail = ref('');
const appPronto = ref(false);
let authSubscription: any = null;

// Estados
const estaAberto = ref(false);
const abaAtiva = ref<'inventario' | 'emprestimos' | 'equipe'>('inventario');
const listaCautelasRef = ref<any>(null);

// Setup de Plantonista
const { plantonistaAtual, definirPlantonista, recuperarPlantonista } =
    usePlantonista();

const listaPlantonistas = ref<Pessoa[]>([]);

// --- FUNÇÕES DE AUTENTICAÇÃO ---
async function verificarUsuario() {
    try {
        const { data } = await supabaseClient.auth.getSession();
        sessao.value = data.session;
        if (sessao.value) {
            usuarioEmail.value = sessao.value.user.email || '';
        }

        const response = supabaseClient.auth.onAuthStateChange(
            (_event, _session) => {
                sessao.value = _session;

                if (_session) {
                    usuarioEmail.value = _session.user.email || '';
                } else {
                    abaAtiva.value = 'inventario';
                }
            }
        );

        authSubscription = response.data.subscription;
    } catch (error) {
        console.error('Erro na auth:', error);
    } finally {
        appPronto.value = true;
    }
}

async function handleLogout() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) console.error('Erro ao sair:', error);

    sessao.value = null;
    abaAtiva.value = 'inventario';
}
// -----

// Configura o Dropdown do Header
const dropHeader = reactive(
    useDropdownSelect(
        listaPlantonistas,
        ['nome', 'graduacao'],
        (p) => `${p.graduacao} ${p.nome}`
    )
);

// Busca APENAS os plantonistas autorizados
async function carregarPlantonistas() {
    const { data } = await supabaseClient
        .from('pessoa')
        .select('*')
        .eq('eh_plantonista', true)
        .order('nome');

    if (data) listaPlantonistas.value = data;
}

// Ao selecionar no dropdown, salva no global
function trocarPlantonista(p: Pessoa) {
    definirPlantonista(p);
    dropHeader.selecionar(p);
}

// --- CONTROLE DO MODAL ---
function abrirModal() {
    estaAberto.value = true;
}
function fecharModal() {
    estaAberto.value = false;
}

function onCautelaCriada() {
    if (abaAtiva.value === 'emprestimos') {
        listaCautelasRef.value?.carregarCautelas()
    }

    abaAtiva.value = 'emprestimos';
}
// ------

onUnmounted(() => {
    if (authSubscription) {
        authSubscription.unsubscribe();
    }
});

onMounted(() => {
    verificarUsuario();
    carregarPlantonistas();
    recuperarPlantonista();

    if (plantonistaAtual.value) {
        dropHeader.termoBusca = `${plantonistaAtual.value.graduacao} ${plantonistaAtual.value.nome}`;
        dropHeader.itemSelecionado = plantonistaAtual.value;
    }
});
</script>

<template>
    <div
        v-if="!appPronto"
        class="min-h-screen flex items-center justify-center bg-gray-50"
    >
        <div class="text-center">
            <Loader2 class="w-12 h-12 text-red-700 animate-spin mx-auto mb-4" />
            <p class="text-gray-500 font-bold">Carregando sistema...</p>
        </div>
    </div>

    <div v-else>
        <!-- <Login v-if="!sessao" /> -->

        <div class="min-h-screen bg-gray-50 font-inter">
            <header
                class="w-full py-4 px-4 md:px-16 mb-8 flex flex-col md:flex-row md:items-center gap-4 md:gap-4 bg-white shadow-md justify-between"
            >
                <div class="flex flex-row gap-3 items-center p-2">
                    <picture class="w-16 h-16 flex items-center">
                        <img src="./assets/Logo-CBMSE-1.png" alt="" />
                    </picture>
                    <div class="flex flex-col w-full">
                        <h1
                            class="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight"
                        >
                            CBM-SE <span class="text-red-700">Logística</span>
                        </h1>
                        <p
                            class="text-gray-500 text-xs md:text-sm mt-1 flex flex-row items-start md:items-center gap-2"
                        >
                            Sistema de Controle de Cautelas
                            <span
                                class="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold"
                                >Online</span
                            >
                        </p>
                    </div>
                </div>
                <hr class="md:hidden text-gray-200" />

                <div class="flex flex-row gap-4">
                    <div class="relative w-64 md:w-72">
                        <label
                            class="text-[10px] uppercase font-bold text-gray-400 ml-1"
                            >Plantonista Responsável</label
                        >
                        <div class="relative group">
                            <UserCog
                                class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-700"
                            />
                            <input
                                type="text"
                                v-model="dropHeader.termoBusca"
                                @focus="dropHeader.abrir"
                                @blur="dropHeader.fecharComDelay"
                                @click="dropHeader.abrir"
                                placeholder="Selecione seu nome..."
                                class="w-full pl-9 pr-8 py-2 bg-white border-2 border-transparent hover:border-gray-200 focus:border-red-600 rounded-lg text-sm font-bold text-gray-800 outline-none transition cursor-pointer shadow-sm"
                                readonly
                            />
                            <ChevronDown
                                class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                            />
                            <div
                                v-if="
                                    dropHeader.estaAberto &&
                                    listaPlantonistas.length
                                "
                                class="absolute z-50 mt-1 w-full bg-white shadow-xl border border-gray-100 rounded-xl overflow-hidden animate-fade-in"
                            >
                                <button
                                    v-for="p in listaPlantonistas"
                                    :key="p.id_pessoa"
                                    @mousedown.prevent="trocarPlantonista(p)"
                                    class="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center justify-between border-b border-gray-50 last:border-0 transition"
                                >
                                    <span
                                        class="font-bold text-gray-700 text-sm"
                                        >{{ p.graduacao }} {{ p.nome }}</span
                                    >
                                    <span
                                        v-if="
                                            plantonistaAtual?.id_pessoa ===
                                            p.id_pessoa
                                        "
                                        class="w-2 h-2 rounded-full bg-green-500"
                                    ></span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <button
                        @click="handleLogout"
                        class="bg-white border border-gray-200 text-gray-600 hover:text-red-700 hover:border-red-200 p-2.5 rounded-xl transition shadow-sm h-fit mt-auto"
                        title="Sair do Sistema"
                    >
                        <LogOut class="w-4 h-4 md:w-5 md:h-5 text-gray-800" />
                    </button>
                </div>
            </header>
            <main class="max-w-7xl w-full mx-auto px-4 bg-gray-50">
                <div
                    class="flex items-center justify-center md:justify-between gap-3 md:w-auto mx-2 lg:mx-0"
                >
                    <button
                        @click="abrirModal"
                        class="bg-red-700 hover:bg-red-800 text-white pl-3 pr-4 py-2.5 rounded-xl font-bold text-sm transition shadow-lg shadow-red-700/20 active:scale-95 flex items-center gap-2 whitespace-nowrap"
                    >
                        <Plus class="w-5 h-5" />
                        Nova Retirada
                    </button>
                    <button
                        @click="abaAtiva = 'equipe'"
                        class="flex-1 md:flex-none justify-center bg-white border border-gray-200 text-gray-700 hover:text-red-700 hover:border-red-200 px-4 py-2.5 rounded-xl font-bold text-sm transition shadow-sm active:scale-95 flex items-center gap-2 whitespace-nowrap w-fit"
                        :class="{
                            'ring-2 ring-red-100 border-red-200 text-red-700':
                                abaAtiva === 'equipe',
                        }"
                    >
                        <Users class="w-5 h-5" />
                        Gerenciar Efetivo
                    </button>
                </div>
                <div
                    class="flex w-full my-8 items-center border-b border-gray-200"
                >
                    <button
                        @click="abaAtiva = 'inventario'"
                        class="px-4 py-3 w-full text-sm font-bold flex justify-center items-center gap-2 border-b-2 transition"
                        :class="
                            abaAtiva === 'inventario'
                                ? 'border-red-600 text-red-600 bg-gray-100 rounded-t-md'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        "
                    >
                        <LayoutGrid
                            class="w-4 h-4"
                            :class="
                                abaAtiva === 'inventario'
                                    ? 'text-red-600'
                                    : 'text-gray-500'
                            "
                        />
                        Inventário Geral
                    </button>
                    <button
                        @click="abaAtiva = 'emprestimos'"
                        class="px-4 py-3 w-full text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition"
                        :class="
                            abaAtiva === 'emprestimos'
                                ? 'border-red-600 text-red-600 bg-gray-100 rounded-t-md'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        "
                    >
                        <ClipboardList
                            class="w-4 h-4"
                            :class="
                                abaAtiva === 'emprestimos'
                                    ? 'text-red-600'
                                    : 'text-gray-500'
                            "
                        />
                        Empréstimos
                    </button>

                </div>

                <Inventario v-if="abaAtiva === 'inventario'" />
                <ListaCautelas 
                    v-if="abaAtiva === 'emprestimos'"
                    ref="listaCautelasRef" 
                />
                <ListaBombeiros
                    v-if="abaAtiva === 'equipe'"
                    @refresh-plantonistas="carregarPlantonistas"
                />
            </main>
            <NovaCautela
                :estaAberto="estaAberto"
                :fecharModal="fecharModal"
                :usuarioLogado="usuarioEmail"
                @cautela-salva="onCautelaCriada"
            />
        </div>
    </div>
</template>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(5px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
