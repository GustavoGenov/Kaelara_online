import { ENV } from './env.js';
import { openWithCustomBrowser } from './customBrowser.js';
import axios from 'axios';

/**
 * Realiza uma busca na web.
 * Se a variável de ambiente `CUSTOM_BROWSER_PATH` estiver configurada,
 * abre a URL de busca no navegador especificado e não utiliza APIs externas.
 * Caso contrário, faz fallback para a API SerpAPI (ou Bing) usando a chave
 * presente em `SERPAPI_KEY`.
 */
export async function searchWeb(query) {
  // Se o usuário informou o caminho do navegador, abra nele direto
  if (ENV.CUSTOM_BROWSER_PATH) {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    await openWithCustomBrowser(url);
    return { source: 'custom_browser', opened: true, query };
  }

  // Fallback – usar SerpAPI (requer SERPAPI_KEY)
  if (!ENV.SERPAPI_KEY) {
    throw new Error('SerpAPI key não configurada e CUSTOM_BROWSER_PATH ausente.');
  }
  const apiUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${ENV.SERPAPI_KEY}`;
  const response = await axios.get(apiUrl);
  return { source: 'serpapi', data: response.data };
}
