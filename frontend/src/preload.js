import { contextBridge, ipcRenderer } from 'electron';

/**
 * Script de pré-carregamento (Preload Script) da Kaelara no Electron.
 *
 * Utiliza `contextBridge.exposeInMainWorld` para expor uma API segura, estrita e controlada
 * para o contexto do navegador (Renderer Process), prevenindo vazamento de objetos nativos do Node.js.
 */
contextBridge.exposeInMainWorld('kaelara', {
  /**
   * Solicita autorização explícita do usuário para ações que afetam hardware ou dados críticos.
   *
   * @param {string} action - Descrição técnica ou amigável da ação requerida.
   * @returns {Promise<boolean>} Promessa resolvida com true se permitido pelo usuário.
   */
  requestPermission: async (action) => {
    return await ipcRenderer.invoke('request-permission', action);
  },
});
