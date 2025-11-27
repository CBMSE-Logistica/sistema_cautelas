import Fuse, { type IFuseOptions } from 'fuse.js';

/**
 * @param list A lista completa de dados (Genérica T)
 * @param term O termo que está sendo buscado
 * @param keys As chaves do objeto T onde a busca deve ocorrer
 * @param threshold O nível de sensibilidade (0.0 = exato, 1.0 = tudo)
 */

export function fuzzySearch<T>(
  list: T[], 
  term: string, 
  keys: string[], 
  threshold = 0.4
): T[] {
  if (!term) return list;

  const options: IFuseOptions<T > = {
    keys: keys,
    threshold: threshold,
    ignoreLocation: true // Procura no texto todo, não só no começo
  };

  const fuse = new Fuse(list, options);
  
  // O Fuse retorna um objeto { item, refIndex }, mas queremos só o item (T)
  return fuse.search(term).map(result => result.item);
}