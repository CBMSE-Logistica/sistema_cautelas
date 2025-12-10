<script setup lang="ts">
import { ref, watch } from 'vue';
import { supabaseClient } from '../supabase/supabaseClient';
import type { Pessoa } from '../types';
import {
    X,
    Save,
    UserPlus,
    Trash2,
    User,
    Phone,
    IdCard,
} from 'lucide-vue-next';

// --- PROPS ---
const props = defineProps<{
    estaAberto: boolean;
    fecharModal: () => void;
    bombeiro: Pessoa | null; // Null = Criação, Objeto = Edição
}>();
const emit = defineEmits(['atualizar-lista']);

// --- ESTADOS ---
const salvando = ref(false);

const form = ref({
    nome: '',
    cpf: '',
    matricula: '',
    graduacao: 'Soldado', // Padrão
    unidade: '1º GBM', // Padrão
    contato: '',
    eh_plantonista: false,
});

// Opções de Patente (Para evitar erros de digitação)
const graduacoes = [
    'Soldado',
    'Cabo',
    '3º Sargento',
    '2º Sargento',
    '1º Sargento',
    'Subtenente',
    'Aspirante',
    'Tenente',
    'Capitão',
    'Major',
    'Ten. Coronel',
    'Coronel',
];

// --- CARREGAMENTO ---
watch(
    () => props.estaAberto,
    (aberto) => {
        if (aberto) {
            if (props.bombeiro) {
                // MODO EDIÇÃO: Copia dados
                form.value = { ...props.bombeiro };
            } else {
                // MODO CRIAÇÃO: Limpa
                form.value = {
                    nome: '',
                    cpf: '',
                    matricula: '',
                    graduacao: 'Soldado',
                    unidade: '1º GBM',
                    contato: '',
                    eh_plantonista: false,
                };
            }
        }
    }
);

// --- MÁSCARA CPF SIMPLES ---
function aplicarMascaraCPF() {
    let v = form.value.cpf.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);

    // 000.000.000-00
    form.value.cpf = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// --- AÇÕES ---
async function salvar() {
    if (!form.value.nome || !form.value.cpf || !form.value.matricula) {
        return alert('Nome, CPF e Matrícula são obrigatórios.');
    }

    salvando.value = true;

    try {
        if (props.bombeiro) {
            // UPDATE
            const { error } = await supabaseClient
                .from('pessoa')
                .update(form.value)
                .eq('id_pessoa', props.bombeiro.id_pessoa);
            if (error) throw error;
        } else {
            // INSERT
            const { error } = await supabaseClient
                .from('pessoa')
                .insert(form.value);
            if (error) throw error;
        }

        emit('atualizar-lista');
        props.fecharModal();
        alert(props.bombeiro ? 'Dados atualizados!' : 'Bombeiro cadastrado!');
    } catch (e: any) {
        alert(
            'Erro ao salvar: ' +
                e.message +
                '\n(Verifique se CPF ou Matrícula já existem)'
        );
    } finally {
        salvando.value = false;
    }
}

async function excluir() {
    if (!props.bombeiro) return;
    if (
        !confirm(
            `Tem certeza que deseja excluir ${props.bombeiro.graduacao} ${props.bombeiro.nome}?`
        )
    )
        return;

    try {
        const { error } = await supabaseClient
            .from('pessoa')
            .delete()
            .eq('id_pessoa', props.bombeiro.id_pessoa);

        if (error) throw error;

        emit('atualizar-lista');
        props.fecharModal();
        alert('Registro excluído.');
    } catch (e: any) {
        if (e.code === '23503') {
            alert(
                'Não é possível excluir: Este bombeiro possui histórico de cautelas ou devoluções.'
            );
        } else {
            alert('Erro ao excluir: ' + e.message);
        }
    }
}
</script>

<template>
    <div
        v-if="estaAberto"
        class="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-sm"
    >
        <div
            class="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in"
        >
            <div
                class="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50"
            >
                <h2
                    class="text-xl font-bold text-gray-800 flex items-center gap-2"
                >
                    <UserPlus class="w-6 h-6 text-red-700" />
                    {{ bombeiro ? 'Editar Dados' : 'Novo Bombeiro' }}
                </h2>
                <button
                    @click="fecharModal"
                    class="text-gray-400 hover:text-red-600 transition"
                >
                    <X class="w-6 h-6" />
                </button>
            </div>

            <div class="p-6 overflow-y-auto flex-1 scrollbar-thin space-y-4">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1"
                        >Nome Completo</label
                    >
                    <div class="relative">
                        <User
                            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                        />
                        <input
                            v-model="form.nome"
                            type="text"
                            class="w-full pl-10 p-3 border rounded-xl focus:ring-2 focus:ring-red-600/20 outline-none uppercase text-gray-800"
                            placeholder="NOME DE GUERRA"
                        />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label
                            class="block text-sm font-bold text-gray-700 mb-1"
                            >Graduação</label
                        >
                        <select
                            v-model="form.graduacao"
                            class="w-full p-3 border rounded-xl focus:ring-2 focus:ring-red-600/20 outline-none bg-white text-gray-800"
                        >
                            <option
                                v-for="g in graduacoes"
                                :value="g"
                                class="p-8"
                            >
                                {{ g }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label
                            class="block text-sm font-bold text-gray-700 mb-1"
                            >Matrícula</label
                        >
                        <input
                            v-model="form.matricula"
                            type="text"
                            placeholder="00.000-0"
                            class="w-full p-3 border rounded-xl focus:ring-2 focus:ring-red-600/20 outline-none text-gray-800"
                        />
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1"
                        >CPF</label
                    >
                    <div class="relative">
                        <IdCard
                            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                        />
                        <input
                            v-model="form.cpf"
                            @input="aplicarMascaraCPF"
                            type="text"
                            class="w-full pl-10 p-3 border rounded-xl focus:ring-2 focus:ring-red-600/20 outline-none text-gray-800"
                            placeholder="000.000.000-00"
                        />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label
                            class="block text-sm font-bold text-gray-700 mb-1"
                            >Unidade</label
                        >
                        <input
                            v-model="form.unidade"
                            type="text"
                            class="w-full p-3 border rounded-xl focus:ring-2 focus:ring-red-600/20 outline-none text-gray-800"
                        />
                    </div>
                    <div>
                        <label
                            class="block text-sm font-bold text-gray-700 mb-1"
                            >Contato (Celular)</label
                        >
                        <div class="relative">
                            <Phone
                                class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                            />
                            <input
                                v-model="form.contato"
                                type="text"
                                placeholder="(DDD) 9xxxx-xxxx"
                                class="w-full pl-10 p-3 border rounded-xl focus:ring-2 focus:ring-red-600/20 outline-none text-gray-800"
                            />
                        </div>
                    </div>
                </div>
                <div
                    class="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 mt-2"
                >
                    <input
                        type="checkbox"
                        id="chk-plantonista"
                        v-model="form.eh_plantonista"
                        class="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                    />
                    <label
                        for="chk-plantonista"
                        class="text-sm font-bold text-gray-700 cursor-pointer"
                    >
                        Permitir atuar como Plantonista (RTO)?
                    </label>
                </div>
            </div>

            <div
                class="p-5 border-t border-gray-100 bg-gray-50 flex justify-between gap-3"
            >
                <button
                    v-if="bombeiro"
                    @click="excluir"
                    class="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition"
                >
                    <Trash2 class="w-4 h-4" /> Excluir
                </button>
                <div v-else></div>
                <div class="flex gap-3">
                    <button
                        @click="fecharModal"
                        class="px-5 py-2 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition"
                        :disabled="salvando"
                    >
                        Cancelar
                    </button>
                    <button
                        @click="salvar"
                        :disabled="salvando"
                        class="bg-red-700 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-800 transition shadow-lg flex items-center gap-2"
                    >
                        <Save class="w-4 h-4" />
                        {{ salvando ? 'Salvando...' : 'Salvar' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.animate-scale-in {
    animation: scaleIn 0.2s ease-out;
}
@keyframes scaleIn {
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}
</style>
