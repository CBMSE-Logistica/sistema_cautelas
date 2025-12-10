// 1. ESPELHO DO ENUM SQL: 'status_disponibilidade'
export type StatusDisponibilidade = 
  | 'DISPONIVEL' 
  | 'EM_USO' 
  | 'MANUTENCAO' 
  | 'PERDIDO';

// 2. ESPELHO DO ENUM SQL: 'status_cautela'
export type StatusCautela = 
  | 'ABERTA' 
  | 'FINALIZADA' 
  | 'ATRASADA' 
  | 'CANCELADA';

// 3. ESPELHO DO ENUM SQL: 'estado_conservacao'
export type EstadoConservacao = 
  | 'NOVO' 
  | 'BOM' 
  | 'REGULAR' 
  | 'RUIM' 
  | 'INOPERAVEL';

// --- INTERFACES DAS TABELAS ---
export interface Pessoa {
  id_pessoa: number
  nome: string
  cpf: string
  matricula: string
  graduacao: string
  unidade: string
  contato: string
}

export interface Material {
  id_material: number
  nome: string
  numero_serie: string
  estado_conservacao: EstadoConservacao 
  status: StatusDisponibilidade 

  // Relacionamento com o catálogo
  catalogo?: CatalogoEquipamento
  fk_catalogo?: number
}

export interface CatalogoEquipamento {
  id: number
  nome: string 
  descricao?: string
  // --- Campos calculados
  total_itens?: number
  total_disponivel?: number
}

export interface Cautela {
  id_cautela: number
  data_hora_retirada: string
  data_previsao_devolucao: string
  status: StatusCautela 
  motivo_cautela: string
  plantonista_rto: string
  // JOINs (quando buscamos dados relacionados)
  responsavel: Pessoa 
  itens: Material[]
  data_devolucao_real?: string
}

export interface ItemCautela {
  id_item_cautela: number
  fk_id_cautela: number
  fk_id_material: number
  quantidade_cautelada: number
  observacoes?: string
}