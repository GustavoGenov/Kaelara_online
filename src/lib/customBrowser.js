import { spawn } from 'child_process';
import { ENV } from './env.js';

/**
 * Abre a URL usando o navegador fornecido pelo usuário.
 *
 * A variável de ambiente `CUSTOM_BROWSER_PATH` deve conter **o caminho completo
 * para o executável do navegador** (por exemplo
 * "D:\\backup\\Kaelara_backup\\navegador\\browser.exe").
 * Não há buscas adicionais em diretórios – o caminho é usado exatamente como
 * fornecido.
 */
export async function openWithCustomBrowser(url) {
  if (!ENV.CUSTOM_BROWSER_PATH) {
    throw new Error('Caminho do navegador não configurado (CUSTOM_BROWSER_PATH).');
  }

  // Assume que CUSTOM_BROWSER_PATH já aponta para o executável.
  const execPath = ENV.CUSTOM_BROWSER_PATH;

  return new Promise((resolve, reject) => {
    const proc = spawn(execPath, [url], {
      detached: true,
      stdio: 'ignore',
    });
    proc.on('error', (err) => reject(err));
    proc.unref();
    resolve();
  });
}
