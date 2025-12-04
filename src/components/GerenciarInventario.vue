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
    catalogo: CatalogoEquipamento | null; // Se null, é CRIAÇÃO. Se vier dados, é EDIÇÃO.
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
                abaAtiva.value = 'estoque'; // Já abre direto no estoque pra agilizar
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
        .order('numero_serie', { ascending: true }); // Ordena por serial

    if (!error) listaFisica.value = data || [];
    carregando.value = false;
}

// --- AÇÕES DO CATÁLOGO (PAI) ---
// --- ADICIONAR OU EDITAR ---
async function salvarCatalogo() {
    if (!formCatalogo.value.nome) return alert('O nome é obrigatório.');

    salvando.value = true;

    try {
        if (props.catalogo) {
            // UPDATE
            await supabaseClient
                .from('catalogo_equipamento')
                .update(formCatalogo.value)
                .eq('id', props.catalogo.id);
        } else {
            // INSERT
            const { error } = await supabaseClient
                .from('catalogo_equipamento')
                .insert(formCatalogo.value)
                .select()
                .single();

            if (error) throw error;

            // Se criou novo, avisa o pai e fecha (ou poderia mudar para modo edição)
            emit('atualizar-lista');
            props.fecharModal();
            alert('Equipamento cadastrado com sucesso!');
            return; // Sai da função
        }

        emit('atualizar-lista');
        alert('Dados atualizados!');
    } catch (e: any) {
        alert('Erro: ' + e.message);
    } finally {
        salvando.value = false;
    }
}

// --- EXCLUIR ---
async function excluirCatalogo() {
    if (!props.catalogo) return;

    // 1. Confirmação de segurança
    const confirmacao = confirm(
        `Tem certeza que deseja excluir "${props.catalogo.nome}" do sistema?\n\nIsso só será possível se NÃO houver nenhum item físico cadastrado neste grupo.`
    );

    if (!confirmacao) return;

    carregando.value = true;

    try {
        // 2. Tenta deletar no Supabase
        const { error } = await supabaseClient
            .from('catalogo_equipamento')
            .delete()
            .eq('id', props.catalogo.id);

        if (error) {
            // Se der erro de chave estrangeira (FK), é porque tem itens
            if (error.code === '23503') {
                throw new Error(
                    'Não é possível excluir: Existem itens físicos cadastrados neste catálogo. Exclua o estoque primeiro.'
                );
            }
            throw error;
        }

        // 3. Sucesso
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

        // Limpa e recarrega
        novoItem.value.numero_serie = '';
        await carregarItensFisicos(props.catalogo.id);
        emit('atualizar-lista'); // Para atualizar os contadores fora do modal
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

// Atalho para mudar estado rápido
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
        class="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-sm"
    >
        <div
            class="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
            <div
                class="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50"
            >
                <h2
                    class="text-xl font-bold text-gray-800 flex items-center gap-2"
                >
                    <Box class="w-6 h-6 text-red-700" />
                    {{ catalogo ? 'Gerenciar Equipamento' : 'Novo Cadastro' }}
                </h2>
                <button
                    @click="fecharModal"
                    class="text-gray-400 hover:text-red-600 transition"
                >
                    <X class="w-6 h-6" />
                </button>
            </div>

            <div class="flex border-b border-gray-200">
                <button
                    @click="abaAtiva = 'detalhes'"
                    class="flex-1 py-3 text-sm font-bold transition border-b-2"
                    :class="
                        abaAtiva === 'detalhes'
                            ? 'border-red-600 text-red-700 bg-red-50/50'
                            : 'border-transparent text-gray-500 hover:bg-gray-50'
                    "
                >
                    Detalhes do Produto
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
                    Estoque Físico ({{ listaFisica.length }})
                </button>
            </div>

            <div class="p-6 overflow-y-auto flex-1 scrollbar-thin bg-gray-50">
                <div v-if="abaAtiva === 'detalhes'" class="space-y-4">
                    <div>
                        <label
                            class="block text-sm font-bold text-gray-700 mb-1"
                            >Nome do Equipamento</label
                        >
                        <input
                            v-model="formCatalogo.nome"
                            type="text"
                            placeholder="Ex: Capacete Gallet F1"
                            class="w-full p-3 border rounded-xl focus:ring-2 focus:ring-red-600/20 outline-none text-gray-800"
                        />
                    </div>
                    <div>
                        <label
                            class="block text-sm font-bold text-gray-700 mb-1"
                            >Descrição Técnica</label
                        >
                        <textarea
                            v-model="formCatalogo.descricao"
                            rows="4"
                            placeholder="Especificações, cor, modelo..."
                            class="w-full p-3 border rounded-xl focus:ring-2 focus:ring-red-600/20 outline-none text-gray-800"
                        ></textarea>
                    </div>
                    <div class="flex flex-row gap-4 justify-between">
                        <div
                            v-if="catalogo"
                            class="w-full border-t border-gray-100"
                        >
                            <button
                                @click="excluirCatalogo"
                                class="w-full flex items-center justify-center gap-2 text-red-600 bg-red-50 hover:bg-red-200 hover:text-red-800 py-3 rounded-xl font-bold transition border-gray-900"
                            >
                                <Trash2 class="w-5 h-5" /> Excluir equipamento
                            </button>
                            <p class="text-xs text-center text-gray-400  mt-2">
                                Só permitido se o estoque estiver zerado.
                            </p>
                        </div>
                        <div class="w-full">
                            <button
                                @click="salvarCatalogo"
                                :disabled="salvando"
                                class="bg-red-700 text-white px-6 py-3 rounded-xl font-bold w-full hover:bg-red-800 transition flex justify-center gap-2"
                            >
                                <Save class="w-5 h-5" />
                                {{
                                    salvando
                                        ? 'Salvando...'
                                        : 'Salvar alterações'
                                }}
                            </button>
                        </div>
                    </div>
                </div>

                <div v-if="abaAtiva === 'estoque'" class="space-y-6">
                    <div
                        class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
                    >
                        <h3
                            class="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"
                        >
                            <Plus class="w-4 h-4" /> Adicionar Unidade ao
                            Estoque
                        </h3>
                        <div class="flex gap-3">
                            <input
                                v-model="novoItem.numero_serie"
                                @input="
                                    novoItem.numero_serie =
                                        novoItem.numero_serie.toUpperCase()
                                "
                                @keyup.enter="adicionarItemFisico"
                                type="text"
                                placeholder="Número de Série / Patrimônio"
                                class="flex-1 p-2 border rounded-lg text-sm outline-none focus:border-red-500 uppercase text-gray-800 border-gray-300"
                            />
                            <select
                                v-model="novoItem.estado_conservacao"
                                class="p-2 border rounded-lg text-sm outline-none bg-gray-50 text-gray-800 border-gray-300"
                                title="Selecione o estado do equipamento"
                            >
                                <option value="NOVO">NOVO</option>
                                <option value="BOM">BOM</option>
                                <option value="REGULAR">REGULAR</option>
                            </select>
                            <button
                                @click="adicionarItemFisico"
                                class="bg-green-600 text-white px-4 rounded-lg hover:bg-green-700 transition"
                                title="Adicionar equipamento ao estoque"
                            >
                                <Plus class="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div v-if="carregando" class="text-center py-8">
                        <Loader2
                            class="w-8 h-8 animate-spin mx-auto text-gray-400"
                        />
                    </div>

                    <div v-else class="space-y-2">
                        <div
                            v-for="item in listaFisica"
                            :key="item.id_material"
                            class="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 hover:border-red-200 transition group"
                        >
                            <div class="flex items-center gap-3">
                                <QrCode class="w-5 h-5 text-gray-400" />
                                <div>
                                    <div
                                        class="font-mono font-bold text-gray-800"
                                    >
                                        {{ item.numero_serie }}
                                    </div>
                                    <div class="text-[10px] flex gap-2 mt-0.5">
                                        <span
                                            :class="
                                                item.status === 'DISPONIVEL'
                                                    ? 'text-green-600'
                                                    : 'text-blue-600 font-bold'
                                            "
                                            >{{ item.status }}</span
                                        >
                                    </div>
                                </div>
                            </div>

                            <div class="flex items-center gap-2">
                                <select
                                    :value="item.estado_conservacao"
                                    @change="(e) => alterarEstado(item.id_material, (e.target as HTMLSelectElement).value)"
                                    class="text-xs border rounded px-2 py-1 bg-gray-50 cursor-pointer hover:bg-gray-100 text-gray-800 border-gray-300"
                                >
                                    <option value="NOVO">NOVO</option>
                                    <option value="BOM">BOM</option>
                                    <option value="REGULAR">REGULAR</option>
                                    <option value="RUIM">RUIM</option>
                                    <option value="INOPERAVEL">
                                        INOPERÁVEL
                                    </option>
                                </select>

                                <button
                                    @click="excluirItemFisico(item.id_material)"
                                    class="hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-2xl p-2 transition"
                                    title="Excluir item do estoque"
                                >
                                    <Trash2 class="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div
                            v-if="listaFisica.length === 0"
                            class="text-center py-6 text-gray-400 text-sm"
                        >
                            Nenhum item físico cadastrado neste grupo.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
