<script setup lang="ts">
import { ref } from 'vue'
import { supabaseClient } from '../supabase/supabaseClient'
import { Loader2, Lock, Mail , AlertCircle} from 'lucide-vue-next'

const carregando = ref(false)
const email = ref('')
const senha = ref('')
const msgErro = ref('')

async function handleLogin() {
  carregando.value = true
  msgErro.value = ''

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: email.value,
    password: senha.value,
  })

  if (error) {
    msgErro.value = 'Email ou senha inválidos.'
    carregando.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
    <div class="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-gray-200">
      
      <div class="bg-red-800 p-8 text-center">
        
        <div class="w-24 h-24 mx-auto mb-4 white">
          <img src="../assets/Logo-CBMSE-1.svg" alt="Brasão do Corpo de Bombeiros Militar de Sergipe" class="brightness-0 invert"/>
        </div>
        <h1 class="text-2xl font-bold text-white tracking-wide">CBMSE-LOG</h1>
        <p class="text-red-100 text-sm mt-1">Acesso Restrito ao Plantonista</p>
      </div>

      <form @submit.prevent="handleLogin" class="p-8 space-y-6">
        
        <div v-if="msgErro" class="bg-red-50 text-red-600 text-sm font-semibold p-3 rounded-lg border border-red-100 flex items-center justify-center">
            <AlertCircle class="w-5 h-5 text-red-500 mr-3"/>
            {{ msgErro }}
        </div>

        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">Email Institucional</label>
          <div class="relative">
            <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              v-model="email"
              type="email" 
              placeholder="ex: sd.silva@cbm.se.gov.br"
              class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none transition text-gray-800"
              required
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">Senha</label>
          <div class="relative">
            <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              v-model="senha"
              type="password" 
              placeholder="••••••••"
              class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none transition text-gray-800"
              required
            />
          </div>
        </div>

        <button 
          type="submit" 
          :disabled="carregando"
          class="w-full bg-red-800 hover:bg-red-900 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-red-700/20 active:scale-95 flex items-center justify-center gap-2"
        >
          <Loader2 v-if="carregando" class="w-5 h-5 animate-spin" />
          {{ carregando ? 'Acessando...' : 'Entrar no Sistema' }}
        </button>

      </form>
      
      <div class="bg-gray-50 p-4 text-center border-t border-gray-100">
        <p class="text-xs text-gray-400">Sistema de Controle de Cautelas v1.0</p>
      </div>

    </div>
  </div>
</template>