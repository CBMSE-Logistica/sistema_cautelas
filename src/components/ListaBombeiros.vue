<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabaseClient } from '../supabase/supabaseClient';
import { useBusca } from '../composables/useBusca';
import type { Pessoa } from '../types';
import { Users, Search, Plus, RefreshCw, User } from 'lucide-vue-next';
import GerenciarBombeiro from './GerenciarBombeiro.vue';

// Estados
const carregando = ref(true);
const listaBombeiros = ref<Pessoa[]>([]);
const modalAberto = ref(false);
const bombeiroSelecionado = ref<Pessoa | null>(null);

// Busca
const { termoBusca, resultados: listaFiltrada } = useBusca(listaBombeiros, [
    'graduacao',
    'nome',
    'matricula',
    'cpf',
]);

const emit = defineEmits(['refresh-plantonistas']);

// Fetch
async function buscarBombeiros() {
    carregando.value = true;
    const { data, error } = await supabaseClient
        .from('pessoa')
        .select('*')
        .order('nome');
    if (!error) listaBombeiros.value = data || [];
    carregando.value = false;
}

// Modal Actions
function abrirNovo() {
    bombeiroSelecionado.value = null;
    modalAberto.value = true;
}
function abrirEdicao(b: Pessoa) {
    bombeiroSelecionado.value = b;
    modalAberto.value = true;
}
function fecharModal() {
    modalAberto.value = false;
}

function aoSalvarBombeiro() {
    buscarBombeiros();
    emit('refresh-plantonistas');
}

onMounted(() => {
    buscarBombeiros();
});
</script>

<template>
    <div class="animate-fade-in">
        <div
            class="flex flex-col md:flex-row justify-between items-start gap-4"
        >
            <div
                class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full"
            >
                <div class="px-2">
                    <h2
                        class="text-xl font-bold text-gray-800 flex items-center gap-2"
                    >
                        <Users class="w-6 h-6 text-red-700" /> Efetivo
                    </h2>
                    <p class="text-sm text-gray-500">
                        Gestão de militares cadastrados
                    </p>
                </div>

                <div class="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <div class="flex gap-2 w-full md:w-auto">
                        <div class="relative w-full md:w-64 group">
                            <Search
                                class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                            />
                            <input
                                v-model="termoBusca"
                                type="text"
                                placeholder="Buscar bombeiro..."
                                class="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-600/10 focus:border-red-600 outline-none transition text-gray-800"
                            />
                        </div>

                        <button
                            @click="buscarBombeiros"
                            class="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-red-600 active:scale-95 transition"
                        >
                            <RefreshCw
                                class="w-5 h-5"
                                :class="{ 'animate-spin': carregando }"
                            />
                        </button>
                    </div>

                    <button
                        @click="abrirNovo"
                        class="bg-gray-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-900 transition w-full md:w-auto active:scale-95 shadow-sm"
                    >
                        <Plus class="w-4 h-4" /> Novo Bombeiro
                    </button>
                </div>
            </div>
        </div>
        <hr class="text-gray-300 my-6">
        <div v-if="carregando" class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
                v-for="i in 6"
                :key="i"
                class="bg-white h-24 rounded-xl border border-gray-100 animate-pulse"
            ></div>
        </div>

        <div
            v-else-if="listaFiltrada.length === 0"
            class="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200"
        >
            <div
                class="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            >
                <Search class="w-8 h-8 text-gray-400" />
            </div>
            <h3 class="text-lg font-bold text-gray-700">
                Nenhum militar cadastrado.
            </h3>
            <p class="text-gray-400 text-sm">
                Adicione militares no botão "Novo Bombeiro".
            </p>
        </div>

        <div
            v-else
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8"
        >
            <div
                v-for="b in listaFiltrada"
                :key="b.id_pessoa"
                @click="abrirEdicao(b)"
                class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-red-200 hover:shadow-md transition cursor-pointer flex items-center gap-4 group"
            >
                <div
                    class="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-red-50 group-hover:text-red-600 transition"
                >
                    <User class="w-6 h-6" />
                </div>
                <div>
                    <h3
                        class="font-bold text-gray-800 group-hover:text-red-700 transition"
                    >
                        {{ b.graduacao }} {{ b.nome }}
                    </h3>
                    <div class="text-xs text-gray-500 flex gap-3 mt-1">
                        <span>Mat: {{ b.matricula }}</span>
                        <span>{{ b.unidade }}</span>
                    </div>
                </div>
            </div>
        </div>

        <GerenciarBombeiro
            :estaAberto="modalAberto"
            :fecharModal="fecharModal"
            :bombeiro="bombeiroSelecionado"
            @atualizarLista="aoSalvarBombeiro"
        />
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
