<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabaseClient } from './supabase/supabaseClient'
import NovaCautela from './components/NovaCautela.vue'
import { useBusca } from './composables/useBusca'
import { Search, Plus, RefreshCw, Box } from 'lucide-vue-next'

// Interface TypeScript (Espelho do Banco de Dados)
interface Material {
  id_material: number
  nome: string
  numero_serie: string
  estado_conservacao: string
  // status: string (Futuramente, quando fizer o JOIN)
}

// Estados
const materiais = ref<Material[]>([])
const carregando = ref(true)
const modalAberto = ref(false)

const {
  termoBusca,
  resultados: materiaisFiltrados,
  estaBuscando
} = useBusca(materiais, ['nome', 'numero_serie', 'estado_conservacao']);

// Função para buscar dados do Supabase
async function buscarMateriais() {
  carregando.value = true
  const { data, error } = await supabaseClient
    .from('material')
    .select('*')
    .order('nome', { ascending: true })

  if (error) {
    console.error(error)
  } else {
    materiais.value = data || []
  }
  
  carregando.value = false
}

// Controle do Modal
function abrirModal() { modalAberto.value = true }
function fecharModal() { modalAberto.value = false }

// Inicialização
onMounted(() => {
  buscarMateriais()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-6 md:p-8 font-sans">
    
    <header class="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
      
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
          🚒 CBM-SE <span class="text-red-700">Logística</span>
        </h1>
        <p class="text-gray-500 text-sm mt-1 flex items-center gap-2">
          Sistema de Controle de Cautelas
          <span class="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">Online</span>
        </p>
      </div>

      <div class="flex items-center gap-3 w-full md:w-auto">
        
        <div class="relative w-full md:w-64 group">
          <Loader2 v-if="estaBuscando" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-600 animate-spin" />
          <Search v-else class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-red-600 transition" />
          
          <input 
            type="text" 
            v-model="termoBusca" 
            placeholder="Buscar equipamento..." 
            class="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600/10 focus:border-red-600 transition shadow-sm text-gray-700"
          >
        </div>
        
        <button 
          @click="buscarMateriais"
          class="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-red-600 hover:border-red-200 transition shadow-sm"
          title="Atualizar Lista"
        >
        	<RefreshCw class="w-5 h-5" :class="{ 'animate-spin': carregando }" />
        </button>

        <button 
			@click="abrirModal"
			class="bg-red-700 hover:bg-red-800 text-white pl-3 pr-4 py-2.5 rounded-xl font-bold text-sm transition shadow-lg shadow-red-700/20 active:scale-95 flex items-center gap-2 whitespace-nowrap"
        >
    		<Plus class="w-5 h-5" />
        	Nova Retirada
        </button>
      </div>
    </header>

    <main class="max-w-7xl mx-auto">
      
      <div v-if="carregando" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="i in 6" :key="i" class="bg-white h-24 rounded-xl shadow-sm border border-gray-100 animate-pulse"></div>
      </div>

      <div v-else-if="materiaisFiltrados.length === 0" class="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
        <div class="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Box class="w-8 h-8 text-gray-400" />
        </div>
        <h3 class="text-lg font-bold text-gray-700">Nenhum equipamento encontrado</h3>
        <p class="text-gray-400 text-sm">Tente buscar por outro termo ou cadastre novos itens.</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        <div 
          v-for="item in materiaisFiltrados" 
          :key="item.id_material"
          class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-red-100 transition duration-200 group relative overflow-hidden"
        >
          <div class="flex justify-between items-start mb-2">
            <span 
              class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              :class="{
                'bg-green-100 text-green-700': item.estado_conservacao === 'NOVO' || item.estado_conservacao === 'BOM',
                'bg-yellow-100 text-yellow-700': item.estado_conservacao === 'REGULAR',
                'bg-red-100 text-red-700': item.estado_conservacao === 'RUIM'
              }"
            >
              {{ item.estado_conservacao }}
            </span>
            <span class="text-xs text-gray-300 font-mono">ID: {{ item.id_material }}</span>
          </div>

          <div class="mt-1">
            <h2 class="text-base font-bold text-gray-800 group-hover:text-red-700 transition-colors leading-tight">
              {{ item.nome }}
            </h2>
            <p class="text-xs text-gray-400 font-mono mt-1 flex items-center gap-1">
              SÉRIE: <span class="bg-gray-50 px-1 rounded text-gray-500 font-semibold">{{ item.numero_serie }}</span>
            </p>
          </div>

          <div class="mt-4 pt-3 border-t border-gray-50 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <button class="text-xs font-bold text-red-600 hover:underline">
              Ver Histórico →
            </button>
          </div>
          
        </div>

      </div>
    </main>

    <NovaCautela
      :esta-aberto="modalAberto" 
      :fechar-modal="fecharModal"
    />
    
  </div>
</template>