<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabaseClient } from '../supabase/supabaseClient';
import type { Cautela } from '../types'; // Importando tipos centralizados
import {
    Clock,
    Calendar,
    AlertTriangle,
    CheckCircle2,
    User,
    Package,
    ChevronRight,
    CornerDownRight,
} from 'lucide-vue-next';

// --- ESTADOS ---
const carregando = ref(true);
const cautelas = ref<any[]>([]);

// --- BUSCAR DADOS ---
async function carregarCautelas() {
    carregando.value = true;

    // Traz a Cautela + Dados do Bombeiro + Itens (e dentro do item, o nome do material)
    const { data, error } = await supabaseClient
        .from('cautela')
        .select(
            `
		id_cautela,
		data_hora_retirada,
		data_previsao_devolucao,
		status,
		pessoa:fk_id_pessoa_responsavel ( id_pessoa, nome, graduacao ),
		itens:item_cautela (quantidade_cautelada, 
			material:fk_id_material ( id_material, nome, numero_serie )
      )
    `
        )
        .order('data_previsao_devolucao', { ascending: true }); // Os mais urgentes primeiro

    if (error) {
        console.error('Erro ao buscar cautelas: ', error);
    } else {
        cautelas.value = (data || []);
    }

    carregando.value = false;
}

// --- UTILITÁRIOS ---

// Formata Data: 2025-11-26 -> 26/11/2025
function formatarData(dataISO: string) {
	const data = new Date(dataISO);
    if (!dataISO || isNaN(data.getTime())) return '--/--';
    return data.toLocaleDateString('pt-BR');
}

// Verifica se está atrasado (Data Previsão < Hoje)
function isAtrasado(previsao: string) {
    const hoje = new Date();
    const dataPrev = new Date(previsao);
    // Zera as horas para comparar apenas dias
    hoje.setHours(0, 0, 0, 0);
    dataPrev.setHours(0, 0, 0, 0);

    return dataPrev < hoje;
}

// Calcula quantos dias restam ou passaram
function diasRestantes(previsao: string) {
    const diff = new Date(previsao).getTime() - new Date().getTime();
    const dias = Math.ceil(diff / (1000 * 3600 * 24));

    if (dias < 0) return `Atrasado há ${Math.abs(dias)} dias`;
    if (dias === 0) return 'Devolução Hoje';
    return `Vence em ${dias} dias`;
}

onMounted(() => {
    carregarCautelas();
});
</script>

<template>
    <div class="animate-fade-in pb-16">
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
            v-else-if="cautelas.length === 0"
            class="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200"
        >
            <div
                class="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            >
                <CheckCircle2 class="w-8 h-8 text-green-600" />
            </div>
            <h3 class="text-lg font-bold text-gray-700">Tudo em ordem!</h3>
            <p class="text-gray-400 text-sm">
                Nenhum equipamento pendente de devolução.
            </p>
        </div>

        <div
            v-else
            class="grid grid-cols-1 px-4 md:grid-cols-1 md:px-12 xl:grid-cols-2 gap-6"
        >
            <div
                v-for="c in cautelas"
                :key="c.id_cautela"
                class="bg-white rounded-xl border shadow-sm transition hover:shadow-md group relative overflow-hidden flex flex-col"
                :class="
                    isAtrasado(c.data_previsao_devolucao)
                        ? 'border-red-200'
                        : 'border-gray-200'
                "
            >
                <div
                    class="absolute left-0 top-0 bottom-0 w-1.5"
                    :class="
                        isAtrasado(c.data_previsao_devolucao)
                            ? 'bg-red-500'
                            : 'bg-blue-500'
                    "
                ></div>

                <div
                    class="p-5 pb-3 border-b border-gray-50 flex justify-between items-start pl-6"
                >
                    <div>
                        <div
                            class="flex items-center gap-2 text-gray-800 font-bold text-lg"
                        >
                            <User class="w-5 h-5 text-gray-400" />
                            {{ c.pessoa.graduacao }} {{ c.pessoa.nome }}
                        </div>
                        <div class="text-xs text-gray-400 ml-7">
                            Protocolo #{{ c.id_cautela }}
                        </div>
                    </div>

                    <div
                        class="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"
                        :class="
                            isAtrasado(c.data_previsao_devolucao)
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-50 text-blue-700'
                        "
                    >
                        <AlertTriangle
                            v-if="isAtrasado(c.data_previsao_devolucao)"
                            class="w-3 h-3"
                        />
                        <Clock v-else class="w-3 h-3" />
                        {{ diasRestantes(c.data_previsao_devolucao) }}
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
                            :key="item.material.id_material"
                            class="text-sm text-gray-700 flex items-start gap-2"
                        >
                            <CornerDownRight
                                class="w-4 h-4 text-gray-300 shrink-0 mt-0.5"
                            />
                            <div>
                                <span class="font-medium">{{
                                    item.material.nome
                                }}</span>
                                <span
                                    class="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded ml-2 font-mono"
                                >
                                    #{{ item.material.numero_serie }}
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
                        <div
                            class="flex items-center gap-1"
                            :class="
                                isAtrasado(c.data_previsao_devolucao)
                                    ? 'text-red-600 font-bold'
                                    : ''
                            "
                        >
                            <Calendar class="w-3 h-3" /> Devolução:
                            {{ formatarData(c.data_previsao_devolucao) }}
                        </div>
                    </div>

                    <button
                        class="bg-white border border-gray-200 text-gray-600 hover:text-green-700 hover:border-green-300 hover:bg-green-50 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1"
                        title="Registrar Devolução"
                    >
                        Devolver <ChevronRight class="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
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
