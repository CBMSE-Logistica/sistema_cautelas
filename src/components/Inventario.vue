<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabaseClient } from '../supabase/supabaseClient';
import { useBusca } from '../composables/useBusca';
import type { CatalogoEquipamento } from '../types';
import {
    Box,
    RefreshCw,
    Search,
    Loader2,
    PackageOpen,
    Plus,
} from 'lucide-vue-next';
import GerenciarInventario from './GerenciarInventario.vue';

// --- ESTADOS ---
const carregando = ref(true);
const catalogoLista = ref<CatalogoEquipamento[]>([]);
const modalGestaoAberto = ref(false);
const catalogoSelecionado = ref<CatalogoEquipamento | null>(null);

// --- BUSCA INTELIGENTE ---
const {
    termoBusca,
    resultados: catalogoFiltrado,
    estaBuscando,
} = useBusca(catalogoLista, ['nome', 'descricao']);

// --- FETCH DADOS ---
async function buscarInventario() {
    carregando.value = true;

    // Busca o Catálogo e faz a contagem dos materiais vinculados
    const { data, error } = await supabaseClient
        .from('catalogo_equipamento')
        .select(
            `
            *, 
            material:material(status)`
        )
        .order('nome');

    if (error) {
        console.error('Erro ao buscar inventário:', error);
    } else {
        // Transforma o retorno do Supabase no tipo CatalogoEquipamento
        catalogoLista.value = data.map((cat: any) => {
            const todosItens = cat.material || [];
            const total = todosItens.length;
            const disponiveis = todosItens.filter(
                (m: any) => m.status === 'DISPONIVEL'
            ).length;

            return {
                ...cat,
                total_itens: total,
                total_disponivel: disponiveis,
            };
        });
    }

    carregando.value = false;
}

// --- FUNÇÕES DE GESTÃO (CRUD) ---
function abrirNovoCadastro() {
    catalogoSelecionado.value = null; // Null = Modo Criação
    modalGestaoAberto.value = true;
}

function abrirEdicao(cat: CatalogoEquipamento) {
    catalogoSelecionado.value = cat; // Objeto = Modo Edição
    modalGestaoAberto.value = true;
}

function fecharGestao() {
    modalGestaoAberto.value = false;
}

function aoAtualizarCatalogo() {
    buscarInventario(); // Recarrega a lista principal para atualizar as contagens
}

onMounted(() => {
    buscarInventario();
});
</script>

<template>
    <div class="animate-fade-in">
        <div
            class="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 p-2"
        >
            <div class="w-full md:w-auto">
                <h2
                    class="text-xl font-bold text-gray-800 flex items-center gap-2"
                >
                    <PackageOpen class="w-6 h-6 text-red-700" />
                    Visão Geral do Estoque
                </h2>
                <p class="text-sm text-gray-500">
                    Disponibilidade por equipamento
                </p>
            </div>

            <div class="flex items-center gap-2 w-full mt-4 md:w-auto">
                <button
                    @click="abrirNovoCadastro"
                    class="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm flex items-center gap-2 transition ml-2"
                >
                    <Plus class="w-4 h-4 text-white" /> Novo
                </button>
                <div class="relative w-full md:w-72 group">
                    <Loader2
                        v-if="estaBuscando"
                        class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-600 animate-spin"
                    />
                    <Search
                        v-else
                        class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-red-600 transition"
                    />

                    <input
                        type="text"
                        v-model="termoBusca"
                        placeholder="Buscar no catálogo..."
                        class="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-600/10 focus:border-red-600 outline-none transition shadow-sm text-gray-800"
                    />
                </div>

                <button
                    @click="buscarInventario"
                    class="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-red-600 hover:border-red-200 transition shadow-sm"
                    title="Atualizar Lista"
                >
                    <RefreshCw
                        class="w-5 h-5"
                        :class="{ 'animate-spin': carregando }"
                    />
                </button>
            </div>
        </div>

        <div
            v-if="carregando"
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
            <div
                v-for="i in 8"
                :key="i"
                class="bg-white h-40 rounded-xl border border-gray-100 animate-pulse"
            ></div>
        </div>

        <div
            v-else-if="catalogoFiltrado.length === 0"
            class="text-center py-24 bg-white rounded-2xl border border-dashed border-gray-200"
        >
            <div
                class="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            >
                <Box class="w-8 h-8 text-gray-400" />
            </div>
            <h3 class="text-lg font-bold text-gray-700">Nada encontrado</h3>
            <p class="text-gray-400 text-sm">
                Nenhum item corresponde à sua busca ou o catálogo está vazio.
            </p>
        </div>

        <div
            v-else
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
            <div
                v-for="cat in catalogoFiltrado"
                :key="cat.id"
                @click="abrirEdicao(cat)"
                class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-red-200 transition duration-300 group cursor-pointer flex flex-col justify-between h-full"
            >
                <div>
                    <div class="flex items-start justify-between mb-2">
                        <span
                            class="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded"
                        >
                            COD: {{ String(cat.id).padStart(3, '0') }}
                        </span>
                    </div>

                    <h3
                        class="font-bold text-gray-800 text-lg leading-tight group-hover:text-red-700 transition mb-2"
                    >
                        {{ cat.nome }}
                    </h3>
                    <p class="text-sm text-gray-500 line-clamp-2 min-h-[2.5em]">
                        {{
                            cat.descricao || 'Sem descrição técnica cadastrada.'
                        }}
                    </p>
                </div>

                <div class="flex justify-between items-end mt-4">
                    <span class="text-xs font-bold text-gray-400 uppercase"
                        >Disponibilidade</span
                    >

                    <div class="text-gray-900 font-mono text-sm">
                        <span
                            class="text-lg font-bold"
                            :class="
                                cat.total_disponivel === 0
                                    ? 'text-red-600'
                                    : 'text-green-700'
                            "
                            title="Número de unidades disponíveis"
                        >
                            {{ cat.total_disponivel }}
                        </span>
                        <span class="text-gray-400 mx-1">/</span>
                        <span
                            class="font-bold"
                            title="Número total existente"
                            >{{ cat.total_itens }}</span
                        >
                    </div>
                </div>
            </div>
        </div>

        <GerenciarInventario
            :estaAberto="modalGestaoAberto"
            :fecharModal="fecharGestao"
            :catalogo="catalogoSelecionado"
            @atualizar-lista="aoAtualizarCatalogo"
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
