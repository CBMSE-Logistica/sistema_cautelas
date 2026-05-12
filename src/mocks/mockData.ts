/**
 * DADOS FICTÍCIOS PARA SIMULAÇÃO
 * Branch: test/simulacao-de-dados
 *
 * Espelha a estrutura real do banco Supabase (types/index.ts)
 * sem depender de conexão com a internet.
 */

import type { Pessoa, Material, CatalogoEquipamento, Cautela } from '../types';

// ─────────────────────────────────────────────────────────────
// EFETIVO (tabela: pessoa)
// ─────────────────────────────────────────────────────────────
export const mockPessoas: Pessoa[] = [
    {
        id_pessoa: 1,
        nome: 'Carlos Alberto Mendonça',
        cpf: '111.222.333-44',
        matricula: '2019001',
        graduacao: 'Sgt',
        unidade: '1º GBM',
        contato: '(79) 98001-1111',
        eh_plantonista: true,
    },
    {
        id_pessoa: 2,
        nome: 'Fernanda Oliveira Souza',
        cpf: '222.333.444-55',
        matricula: '2020042',
        graduacao: 'Cb',
        unidade: '2º GBM',
        contato: '(79) 98002-2222',
        eh_plantonista: false,
    },
    {
        id_pessoa: 3,
        nome: 'Reginaldo Ferreira Lima',
        cpf: '333.444.555-66',
        matricula: '2017088',
        graduacao: 'Ten',
        unidade: '1º GBM',
        contato: '(79) 98003-3333',
        eh_plantonista: true,
    },
    {
        id_pessoa: 4,
        nome: 'Luciana Pereira Rocha',
        cpf: '444.555.666-77',
        matricula: '2021015',
        graduacao: 'Sd',
        unidade: '3º GBM',
        contato: '(79) 98004-4444',
        eh_plantonista: false,
    },
    {
        id_pessoa: 5,
        nome: 'Bruno Andrade Neves',
        cpf: '555.666.777-88',
        matricula: '2015033',
        graduacao: 'Cap',
        unidade: '1º GBM',
        contato: '(79) 98005-5555',
        eh_plantonista: true,
    },
    {
        id_pessoa: 6,
        nome: 'Mariana Costa Alves',
        cpf: '666.777.888-99',
        matricula: '2022007',
        graduacao: 'Sd',
        unidade: '2º GBM',
        contato: '(79) 98006-6666',
        eh_plantonista: false,
    },
    {
        id_pessoa: 7,
        nome: 'Thiago Batista Correia',
        cpf: '777.888.999-00',
        matricula: '2018055',
        graduacao: 'Sgt',
        unidade: '3º GBM',
        contato: '(79) 98007-7777',
        eh_plantonista: true,
    },
    {
        id_pessoa: 8,
        nome: 'Daniela Ribeiro Santos',
        cpf: '888.999.000-11',
        matricula: '2023002',
        graduacao: 'Cb',
        unidade: '1º GBM',
        contato: '(79) 98008-8888',
        eh_plantonista: false,
    },
    {
        id_pessoa: 9,
        nome: 'Eduardo Nascimento Cruz',
        cpf: '999.000.111-22',
        matricula: '2016070',
        graduacao: 'Maj',
        unidade: 'CGE',
        contato: '(79) 98009-9999',
        eh_plantonista: false,
    },
];

// ─────────────────────────────────────────────────────────────
// CATÁLOGO DE EQUIPAMENTOS (tabela: catalogo_equipamento)
// ─────────────────────────────────────────────────────────────
export const mockCatalogo: CatalogoEquipamento[] = [
    {
        id: 1,
        nome: 'Rádio Portátil',
        descricao: 'Rádio comunicador digital portátil Motorola MOTOTRBO série DP2400E.',
        total_itens: 6,
        total_disponivel: 4,
    },
    {
        id: 2,
        nome: 'Máscara de Proteção Respiratória',
        descricao: 'Máscara panorâmica com filtro ABEK-P3 para resgate em ambiente contaminado.',
        total_itens: 4,
        total_disponivel: 2,
    },
    {
        id: 3,
        nome: 'Colete Balístico',
        descricao: 'Colete nível III-A resistente a projéteis de pistola e fragmentação.',
        total_itens: 3,
        total_disponivel: 3,
    },
    {
        id: 4,
        nome: 'Lanterna Tática',
        descricao: 'Lanterna LED recarregável 1200 lúmens com modo strobo e SOS.',
        total_itens: 10,
        total_disponivel: 7,
    },
    {
        id: 5,
        nome: 'Kit Primeiros Socorros',
        descricao: 'Kit de trauma avançado com torniquete, curativo hemostático e prancha espinhal.',
        total_itens: 5,
        total_disponivel: 5,
    },
    {
        id: 6,
        nome: 'Câmera Termal',
        descricao: 'Câmera FLIR TG165 para detecção de pontos quentes em incêndios estruturais.',
        total_itens: 2,
        total_disponivel: 0,
    },
    {
        id: 7,
        nome: 'Respirador Autônomo (SCBA)',
        descricao: 'Aparelho de Respiração Autônoma Scott Air-Pak com cilindro de 30 min.',
        total_itens: 8,
        total_disponivel: 5,
    },
    {
        id: 8,
        nome: 'Capacete Estrutural',
        descricao: 'Capacete de combate a incêndio estrutural Bullard FH2 com viseira.',
        total_itens: 12,
        total_disponivel: 10,
    },
];

// ─────────────────────────────────────────────────────────────
// MATERIAIS (tabela: material)
// ─────────────────────────────────────────────────────────────
export const mockMateriais: Material[] = [
    { id_material: 101, nome: 'Rádio Portátil',      numero_serie: 'MTR-2024-001', status: 'EM_USO',     estado_conservacao: 'BOM',     fk_catalogo: 1 },
    { id_material: 102, nome: 'Rádio Portátil',      numero_serie: 'MTR-2024-002', status: 'DISPONIVEL', estado_conservacao: 'BOM',     fk_catalogo: 1 },
    { id_material: 103, nome: 'Rádio Portátil',      numero_serie: 'MTR-2024-003', status: 'DISPONIVEL', estado_conservacao: 'BOM',     fk_catalogo: 1 },
    { id_material: 104, nome: 'Rádio Portátil',      numero_serie: 'MTR-2024-004', status: 'EM_USO',     estado_conservacao: 'REGULAR', fk_catalogo: 1 },
    { id_material: 105, nome: 'Rádio Portátil',      numero_serie: 'MTR-2024-005', status: 'DISPONIVEL', estado_conservacao: 'BOM',     fk_catalogo: 1 },
    { id_material: 106, nome: 'Rádio Portátil',      numero_serie: 'MTR-2024-006', status: 'MANUTENCAO', estado_conservacao: 'RUIM',    fk_catalogo: 1 },

    { id_material: 201, nome: 'Máscara Respiratória', numero_serie: 'MSK-0001',    status: 'EM_USO',     estado_conservacao: 'BOM',     fk_catalogo: 2 },
    { id_material: 202, nome: 'Máscara Respiratória', numero_serie: 'MSK-0002',    status: 'DISPONIVEL', estado_conservacao: 'NOVO',    fk_catalogo: 2 },
    { id_material: 203, nome: 'Máscara Respiratória', numero_serie: 'MSK-0003',    status: 'EM_USO',     estado_conservacao: 'BOM',     fk_catalogo: 2 },
    { id_material: 204, nome: 'Máscara Respiratória', numero_serie: 'MSK-0004',    status: 'DISPONIVEL', estado_conservacao: 'REGULAR', fk_catalogo: 2 },

    { id_material: 301, nome: 'Câmera Termal',        numero_serie: 'FLIR-TG-001', status: 'EM_USO',     estado_conservacao: 'BOM',     fk_catalogo: 6 },
    { id_material: 302, nome: 'Câmera Termal',        numero_serie: 'FLIR-TG-002', status: 'EM_USO',     estado_conservacao: 'BOM',     fk_catalogo: 6 },

    { id_material: 401, nome: 'Lanterna Tática',      numero_serie: 'LNT-001',     status: 'DISPONIVEL', estado_conservacao: 'NOVO',    fk_catalogo: 4 },
    { id_material: 402, nome: 'Lanterna Tática',      numero_serie: 'LNT-002',     status: 'DISPONIVEL', estado_conservacao: 'BOM',     fk_catalogo: 4 },
    { id_material: 403, nome: 'Lanterna Tática',      numero_serie: 'LNT-003',     status: 'EM_USO',     estado_conservacao: 'BOM',     fk_catalogo: 4 },
];

// ─────────────────────────────────────────────────────────────
// CAUTELAS (tabela: cautela + joins)
// ─────────────────────────────────────────────────────────────
const addDias = (d: number) => new Date(Date.now() + d * 86400000).toISOString();
const subDias = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

// Pessoas e materiais nomeados para evitar indexação com possível undefined
const pFernanda:  Pessoa   = { id_pessoa: 2, nome: 'Fernanda Oliveira Souza',  cpf: '222.333.444-55', matricula: '2020042', graduacao: 'Cb',  unidade: '2º GBM', contato: '(79) 98002-2222', eh_plantonista: false };
const pBruno:     Pessoa   = { id_pessoa: 5, nome: 'Bruno Andrade Neves',       cpf: '555.666.777-88', matricula: '2015033', graduacao: 'Cap', unidade: '1º GBM', contato: '(79) 98005-5555', eh_plantonista: true };
const pThiago:    Pessoa   = { id_pessoa: 7, nome: 'Thiago Batista Correia',    cpf: '777.888.999-00', matricula: '2018055', graduacao: 'Sgt', unidade: '3º GBM', contato: '(79) 98007-7777', eh_plantonista: true };
const pLuciana:   Pessoa   = { id_pessoa: 4, nome: 'Luciana Pereira Rocha',     cpf: '444.555.666-77', matricula: '2021015', graduacao: 'Sd',  unidade: '3º GBM', contato: '(79) 98004-4444', eh_plantonista: false };
const pCarlos:    Pessoa   = { id_pessoa: 1, nome: 'Carlos Alberto Mendonça',   cpf: '111.222.333-44', matricula: '2019001', graduacao: 'Sgt', unidade: '1º GBM', contato: '(79) 98001-1111', eh_plantonista: true };
const pEduardo:   Pessoa   = { id_pessoa: 9, nome: 'Eduardo Nascimento Cruz',   cpf: '999.000.111-22', matricula: '2016070', graduacao: 'Maj', unidade: 'CGE',    contato: '(79) 98009-9999', eh_plantonista: false };

const mRadio1:    Material = { id_material: 101, nome: 'Rádio Portátil',       numero_serie: 'MTR-2024-001', status: 'EM_USO',     estado_conservacao: 'BOM'     };
const mRadio2:    Material = { id_material: 102, nome: 'Rádio Portátil',       numero_serie: 'MTR-2024-002', status: 'DISPONIVEL', estado_conservacao: 'BOM'     };
const mRadio3:    Material = { id_material: 103, nome: 'Rádio Portátil',       numero_serie: 'MTR-2024-003', status: 'DISPONIVEL', estado_conservacao: 'BOM'     };
const mRadio5:    Material = { id_material: 105, nome: 'Rádio Portátil',       numero_serie: 'MTR-2024-005', status: 'DISPONIVEL', estado_conservacao: 'BOM'     };
const mMascara1:  Material = { id_material: 201, nome: 'Máscara Respiratória', numero_serie: 'MSK-0001',     status: 'EM_USO',     estado_conservacao: 'BOM'     };
const mMascara3:  Material = { id_material: 203, nome: 'Máscara Respiratória', numero_serie: 'MSK-0003',     status: 'EM_USO',     estado_conservacao: 'BOM'     };
const mCamera1:   Material = { id_material: 301, nome: 'Câmera Termal',        numero_serie: 'FLIR-TG-001',  status: 'EM_USO',     estado_conservacao: 'BOM'     };
const mCamera2:   Material = { id_material: 302, nome: 'Câmera Termal',        numero_serie: 'FLIR-TG-002',  status: 'EM_USO',     estado_conservacao: 'BOM'     };
const mLanterna1: Material = { id_material: 401, nome: 'Lanterna Tática',      numero_serie: 'LNT-001',      status: 'DISPONIVEL', estado_conservacao: 'NOVO'    };
const mLanterna2: Material = { id_material: 402, nome: 'Lanterna Tática',      numero_serie: 'LNT-002',      status: 'DISPONIVEL', estado_conservacao: 'BOM'     };
const mLanterna3: Material = { id_material: 403, nome: 'Lanterna Tática',      numero_serie: 'LNT-003',      status: 'EM_USO',     estado_conservacao: 'BOM'     };

export const mockCautelas: Cautela[] = [
    // 1. Cautela ativa — em dia (azul)
    {
        id_cautela: 1001,
        data_hora_retirada: subDias(2),
        data_previsao_devolucao: addDias(5),
        status: 'ABERTA',
        motivo_cautela: 'Operação noturna no bairro Industrial',
        plantonista_rto: 'Sgt Carlos Alberto Mendonça',
        responsavel: pFernanda,
        itens: [mRadio1, mMascara1],
    },
    // 2. Cautela ativa — vence hoje (azul)
    {
        id_cautela: 1002,
        data_hora_retirada: subDias(3),
        data_previsao_devolucao: new Date().toISOString(),
        status: 'ABERTA',
        motivo_cautela: 'Suporte ao SAMU em ocorrência de trânsito',
        plantonista_rto: 'Ten Reginaldo Ferreira Lima',
        responsavel: pBruno,
        itens: [mLanterna1, mLanterna2],
    },
    // 3. Cautela ATRASADA (vermelha)
    {
        id_cautela: 1003,
        data_hora_retirada: subDias(10),
        data_previsao_devolucao: subDias(3),
        status: 'ABERTA',
        motivo_cautela: 'Evento público — Festa Junina Centro',
        plantonista_rto: 'Cap Bruno Andrade Neves',
        responsavel: pThiago,
        itens: [mCamera1, mCamera2],
    },
    // 4. Cautela FINALIZADA (verde)
    {
        id_cautela: 1004,
        data_hora_retirada: subDias(7),
        data_previsao_devolucao: subDias(4),
        data_devolucao_real: subDias(4),
        status: 'FINALIZADA',
        motivo_cautela: 'Treinamento de combate a incêndio florestal',
        plantonista_rto: 'Sgt Carlos Alberto Mendonça',
        responsavel: pLuciana,
        itens: [mRadio2, mRadio5],
    },
    // 5. Outra cautela ativa — em dia (azul)
    {
        id_cautela: 1005,
        data_hora_retirada: subDias(1),
        data_previsao_devolucao: addDias(10),
        status: 'ABERTA',
        motivo_cautela: 'Patrulhamento ribeirinho — Rio Sergipe',
        plantonista_rto: 'Sgt Thiago Batista Correia',
        responsavel: pCarlos,
        itens: [mRadio3, mMascara3],
    },
    // 6. Cautela FINALIZADA mais antiga (verde)
    {
        id_cautela: 1006,
        data_hora_retirada: subDias(20),
        data_previsao_devolucao: subDias(15),
        data_devolucao_real: subDias(16),
        status: 'FINALIZADA',
        motivo_cautela: 'Visita técnica à base aérea de Aracaju',
        plantonista_rto: 'Ten Reginaldo Ferreira Lima',
        responsavel: pEduardo,
        itens: [mLanterna3],
    },
];
