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
  matricula: string
  graduacao: string
  unidade?: string // Opcional, pois nem sempre buscamos
  contato?: string
}

export interface Material {
  id_material: number
  nome: string
  numero_serie: string
  estado_conservacao: EstadoConservacao // Tipagem forte aqui
  status: StatusDisponibilidade // Tipagem forte aqui
}

export interface Cautela {
  id_cautela: number
  data_hora_retirada: string
  data_previsao_devolucao: string
  status: StatusCautela // Tipagem forte aqui
  motivo_cautela: string
  plantonista_rto: string
  // JOINs (quando buscamos dados relacionados)
  responsavel: Pessoa 
  itens: Material[]
}

export interface ItemCautela {
  id_item_cautela: number
  fk_id_cautela: number
  fk_id_material: number
  quantidade_cautelada: number
  observacoes?: string
}