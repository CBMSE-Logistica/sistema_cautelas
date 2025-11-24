<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from './supabase/supabaseClient'

interface Material {
  id_material: number
  nome: string
  numero_serie: string
  estado_conservacao: string
}

const materiais = ref<Material[]>([])
const loading = ref(true)

async function buscarMateriais() {
  loading.value = true
  const { data, error } = await supabase
    .from('material')
    .select('*')
    .order('nome', { ascending: true }) // Ordenar alfabeticamente

  if (error) console.error(error)
  else materiais.value = data || []
  
  loading.value = false
}

onMounted(() => {
  buscarMateriais()
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 p-8">
    
    <header class="mb-10 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">
          🚒 CBM-SE: <span class="text-bombeiro-red">Logística</span>
        </h1>
        <p class="text-gray-500 mt-1">Controle de Inventário e Cautelas</p>
      </div>
      <button 
        class="bg-bombeiro-red hover:bg-red-800 text-white px-4 py-2 rounded-lg font-medium transition shadow-lg shadow-red-200"
      >
        + Nova Retirada
      </button>
    </header>

    <div v-if="loading" class="text-center py-20 text-gray-400 animate-pulse">
      Carregando sistema...
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      
      <div 
        v-for="item in materiais" 
        :key="item.id_material"
        class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition duration-300 relative overflow-hidden group"
      >
        <div 
          class="absolute left-0 top-0 bottom-0 w-1.5"
          :class="{
            'bg-green-500': item.estado_conservacao === 'NOVO' || item.estado_conservacao === 'BOM',
            'bg-yellow-500': item.estado_conservacao === 'REGULAR',
            'bg-red-500': item.estado_conservacao === 'RUIM' || item.estado_conservacao === 'DANIFICADO'
          }"
        ></div>

        <div class="pl-2">
          <div class="flex justify-between items-start">
            <h2 class="text-lg font-bold text-gray-800 group-hover:text-bombeiro-red transition-colors">
              {{ item.nome }}
            </h2>
            <span class="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-1 rounded">
              #{{ item.id_material }}
            </span>
          </div>

          <p class="text-sm text-gray-500 mt-2 mb-4">
            Série: <span class="font-medium text-gray-700">{{ item.numero_serie }}</span>
          </p>

          <div class="flex items-center gap-2">
            <span 
              class="text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider"
              :class="{
                'bg-green-100 text-green-700': item.estado_conservacao === 'NOVO' || item.estado_conservacao === 'BOM',
                'bg-yellow-100 text-yellow-700': item.estado_conservacao === 'REGULAR',
                'bg-red-100 text-red-700': item.estado_conservacao === 'RUIM'
              }"
            >
              {{ item.estado_conservacao }}
            </span>
            </div>
        </div>
      </div>

    </div>
  </div>
</template>