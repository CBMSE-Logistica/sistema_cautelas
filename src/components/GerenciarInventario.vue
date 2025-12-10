<script setup lang="ts">
import { ref, watch } from 'vue';
import { supabaseClient } from '../supabase/supabaseClient';
import type {
    CatalogoEquipamento,
    Material,
    EstadoConservacao,
} from '../types';
import { X, Save, Plus, Trash2, Box, QrCode, Loader2 } from 'lucide-vue-next';

// --- PROPS ---
const props = defineProps<{
    estaAberto: boolean;
    fecharModal: () => void;
    catalogo: CatalogoEquipamento | null;
}>();
const emit = defineEmits(['atualizar-lista']);

// --- ESTADOS ---
const carregando = ref(false);
const salvando = ref(false);
const abaAtiva = ref<'detalhes' | 'estoque'>('detalhes');

// Formulário do Catálogo (Pai)
const formCatalogo = ref({
    nome: '',
    descricao: '',
});

// Lista de Itens Físicos (Filhos)
const listaFisica = ref<Material[]>([]);

// Formulário de Novo Item Físico
const novoItem = ref({
    numero_serie: '',
    estado_conservacao: 'NOVO' as EstadoConservacao,
});

// --- CARREGAMENTO ---
watch(
    () => props.estaAberto,
    async (aberto) => {
        if (aberto) {
            if (props.catalogo) {
                // MODO EDIÇÃO
                abaAtiva.value = 'estoque';
                formCatalogo.value = {
                    nome: props.catalogo.nome,
                    descricao: props.catalogo.descricao || '',
                };
                await carregarItensFisicos(props.catalogo.id);
            } else {
                // MODO CRIAÇÃO
                abaAtiva.value = 'detalhes';
                formCatalogo.value = { nome: '', descricao: '' };
                listaFisica.value = [];
            }
        }
    }
);

async function carregarItensFisicos(idCatalogo: number) {
    carregando.value = true;
    const { data, error } = await supabaseClient
        .from('material')
        .select('*')
        .eq('fk_catalogo', idCatalogo)
        .order('numero_serie', { ascending: true });

    if (!error) listaFisica.value = data || [];
    carregando.value = false;
}

// --- AÇÕES DO CATÁLOGO (PAI) ---
async function salvarCatalogo() {
    if (!formCatalogo.value.nome) return alert('O nome é obrigatório.');

    salvando.value = true;

    try {
        if (props.catalogo) {
            await supabaseClient
                .from('catalogo_equipamento')
                .update(formCatalogo.value)
                .eq('id', props.catalogo.id);
        } else {
            const { error } = await supabaseClient
                .from('catalogo_equipamento')
                .insert(formCatalogo.value)
                .select()
                .single();

            if (error) throw error;

            emit('atualizar-lista');
            props.fecharModal();
            alert('Equipamento cadastrado com sucesso!');
            return;
        }

        emit('atualizar-lista');
        alert('Dados atualizados!');
    } catch (e: any) {
        alert('Erro: ' + e.message);
    } finally {
        salvando.value = false;
    }
}

async function excluirCatalogo() {
    if (!props.catalogo) return;

    const confirmacao = confirm(
        `Tem certeza que deseja excluir "${props.catalogo.nome}" do sistema?\n\nIsso só será possível se NÃO houver nenhum item físico cadastrado neste grupo.`
    );

    if (!confirmacao) return;

    carregando.value = true;

    try {
        const { error } = await supabaseClient
            .from('catalogo_equipamento')
            .delete()
            .eq('id', props.catalogo.id);

        if (error) {
            if (error.code === '23503') {
                throw new Error(
                    'Não é possível excluir: Existem itens físicos cadastrados neste catálogo. Exclua o estoque primeiro.'
                );
            }
            throw error;
        }

        alert('Equipamento excluído do catálogo.');
        emit('atualizar-lista');
        props.fecharModal();
    } catch (e: any) {
        alert('Erro: ' + e.message);
    } finally {
        carregando.value = false;
    }
}

// --- AÇÕES DO ESTOQUE (FILHOS) ---
async function adicionarItemFisico() {
    if (!props.catalogo)
        return alert('Salve o catálogo antes de adicionar itens.');
    if (!novoItem.value.numero_serie) return alert('Digite o número de série.');

    try {
        const { error } = await supabaseClient.from('material').insert({
            fk_catalogo: props.catalogo.id,
            nome: props.catalogo.nome,
            numero_serie: novoItem.value.numero_serie.toUpperCase(),
            estado_conservacao: novoItem.value.estado_conservacao,
            status: 'DISPONIVEL',
        });

        if (error) throw error;

        novoItem.value.numero_serie = '';
        await carregarItensFisicos(props.catalogo.id);
        emit('atualizar-lista');
    } catch (e: any) {
        alert('Erro ao adicionar: ' + e.message);
    }
}

async function excluirItemFisico(id: number) {
    if (
        !confirm('Tem certeza? Isso apagará o histórico deste item específico.')
    )
        return;

    const { error } = await supabaseClient
        .from('material')
        .delete()
        .eq('id_material', id);

    if (error)
        alert(
            'Não foi possível excluir (provavelmente está em uso em uma cautela antiga).'
        );
    else {
        await carregarItensFisicos(props.catalogo!.id);
        emit('atualizar-lista');
    }
}

async function alterarEstado(id: number, novoEstado: string) {
    await supabaseClient
        .from('material')
        .update({ estado_conservacao: novoEstado })
        .eq('id_material', id);

    const item = listaFisica.value.find((i) => i.id_material === id);
    if (item) item.estado_conservacao = novoEstado as EstadoConservacao;
}
</script>

<template>
    <div
        v-if="estaAberto"
        class="fixed inset-0 bg-black/60 z-60 flex justify-center items-end md:items-center md:p-4 backdrop-blur-sm"
    >
        <div
            class="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-3xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
            <div
                class="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 bg-gray-50/50 shrink-0"
            >
                <h2
                    class="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2"
                >
                    <Box class="w-6 h-6 text-red-700" />
                    <span class="truncate">{{ catalogo ? 'Gerenciar Estoque' : 'Novo Equipamento' }}</span>
                </h2>
                <button
                    @click="fecharModal"
                    class="text-gray-400 hover:text-red-600 transition p-2 hover:bg-red-50 rounded-full"
                >
                    <X class="w-6 h-6" />
                </button>
            </div>

            <div class="flex border-b border-gray-200 shrink-0">
                <button
                    @click="abaAtiva = 'detalhes'"
                    class="flex-1 py-3 text-sm font-bold transition border-b-2"
                    :class="
                        abaAtiva === 'detalhes'
                            ? 'border-red-600 text-red-700 bg-red-50/50'
                            : 'border-transparent text-gray-500 hover:bg-gray-50'
                    "
                >
                    Detalhes
                </button>
                <button
                    @click="abaAtiva = 'estoque'"
                    class="flex-1 py-3 text-sm font-bold transition border-b-2"
                    :class="
                        abaAtiva === 'estoque'
                            ? 'border-red-600 text-red-700 bg-red-50/50'
                            : 'border-transparent text-gray-500 hover:bg-gray-50'       
                    "
                    :disabled="!catalogo"
                >
                    Estoque <span v-if="catalogo" class="bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full ml-1">{{ listaFisica.length }}</span>
                </button>
            </div>

            <div class="p-4 md:p-6 overflow-y-auto flex-1 scrollbar-thin bg-gray-50">
                
                <div v-if="abaAtiva === 'detalhes'" class="space-y-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-1">Nome do Equipamento</label>
                        <input
                            v-model="formCatalogo.nome"
                            type="text"
                            placeholder="Ex: Capacete Gallet F1"
                            class="w-full p-3 border rounded-xl focus:ring-2 focus:ring-red-600/20 outline-none text-gray-800"
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-1">Descrição Técnica</label>
                        <textarea
                            v-model="formCatalogo.descricao"
                            rows="4"
                            placeholder="Especificações, cor, modelo..."
                            class="w-full p-3 border rounded-xl focus:ring-2 focus:ring-red-600/20 outline-none text-gray-800 resize-none"
                        ></textarea>
                    </div>
                    
                    <div class="pt-4 space-y-3">
                         <button
                            @click="salvarCatalogo"
                            :disabled="salvando"
                            class="bg-red-700 text-white px-6 py-3 rounded-xl font-bold w-full hover:bg-red-800 transition flex justify-center gap-2 items-center"
                        >
                            <Save class="w-5 h-5" />
                            {{ salvando ? 'Salvando...' : 'Salvar Dados' }}
                        </button>
                        
                        <div v-if="catalogo">
                            <button
                                @click="excluirCatalogo"
                                class="w-full flex items-center justify-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 py-3 rounded-xl font-bold transition text-sm"
                            >
                                <Trash2 class="w-4 h-4" /> Excluir Tipo de Equipamento
                            </button>
                            <p class="text-[10px] md:text-xs text-center text-gray-400 mt-2">
                                Só permitido se o estoque estiver zerado.
                            </p>
                        </div>
                    </div>
                </div>

                <div v-if="abaAtiva === 'estoque'" class="space-y-6">
                    
                    <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <h3 class="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <Plus class="w-4 h-4" /> Adicionar Unidade
                        </h3>
                        
                        <div class="flex flex-col md:flex-row gap-3">
                            <input
                                v-model="novoItem.numero_serie"
                                @input="novoItem.numero_serie = novoItem.numero_serie.toUpperCase()"
                                @keyup.enter="adicionarItemFisico"
                                type="text"
                                placeholder="Nº SÉRIE / PATRIMÔNIO"
                                class="flex-1 p-3 border rounded-lg text-sm outline-none focus:border-red-500 uppercase text-gray-800 border-gray-300 font-mono"
                            />
                            
                            <div class="flex gap-2">
                                <select
                                    v-model="novoItem.estado_conservacao"
                                    class="flex-1 md:w-32 p-3 border rounded-lg text-sm outline-none bg-gray-50 text-gray-800 border-gray-300 h-[46px]"
                                    title="Estado"
                                >
                                    <option value="NOVO">NOVO</option>
                                    <option value="BOM">BOM</option>
                                    <option value="REGULAR">REGULAR</option>
                                </select>
                                <button
                                    @click="adicionarItemFisico"
                                    class="bg-green-600 text-white px-4 rounded-lg hover:bg-green-700 transition flex items-center justify-center h-[46px] w-[46px] md:w-auto"
                                    title="Adicionar"
                                >
                                    <Plus class="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div v-if="carregando" class="text-center py-8">
                        <Loader2 class="w-8 h-8 animate-spin mx-auto text-gray-400" />
                    </div>

                    <div v-else class="space-y-3 pb-20 md:pb-0"> <div
                            v-for="item in listaFisica"
                            :key="item.id_material"
                            class="bg-white p-3 rounded-lg border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3"
                        >
                            <div class="flex items-center gap-3">
                                <div class="bg-gray-100 p-2 rounded-lg text-gray-500">
                                    <QrCode class="w-5 h-5" />
                                </div>
                                <div>
                                    <div class="font-mono font-bold text-gray-800 text-base">
                                        {{ item.numero_serie }}
                                    </div>
                                    <div class="text-[10px] uppercase font-bold tracking-wide mt-0.5 flex items-center gap-2">
                                        <span
                                            :class="
                                                item.status === 'DISPONIVEL'
                                                    ? 'text-green-600'
                                                    : 'text-blue-600 font-bold'
                                            "
                                        >
                                            {{ item.status.replace('_', ' ') }}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div class="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                                <select
                                    :value="item.estado_conservacao"
                                    @change="(e) => alterarEstado(item.id_material, (e.target as HTMLSelectElement).value)"
                                    class="flex-1 text-xs border rounded px-2 py-2 bg-gray-50 cursor-pointer font-bold text-gray-600 border-gray-300 h-10"
                                >
                                    <option value="NOVO">NOVO</option>
                                    <option value="BOM">BOM</option>
                                    <option value="REGULAR">REGULAR</option>
                                    <option value="RUIM">RUIM</option>
                                    <option value="INOPERAVEL">INOPERÁVEL</option>
                                </select>

                                <button
                                    @click="excluirItemFisico(item.id_material)"
                                    class="hover:bg-red-50 text-gray-400 hover:text-red-600 rounded bg-gray-50 border border-gray-200 p-2 transition h-10 w-10 flex items-center justify-center"
                                    title="Excluir"
                                >
                                    <Trash2 class="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div
                            v-if="listaFisica.length === 0"
                            class="text-center py-8 text-gray-400 text-sm bg-white rounded-xl border border-dashed border-gray-200"
                        >
                            Nenhum item físico cadastrado neste grupo.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>