import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import * as path from 'path';

/**
 * Referência para a janela principal da aplicação Electron da Kaelara.
 * Mantida em escopo global para evitar garbage collection prematuro.
 */
let mainWindow: BrowserWindow | null = null;

/**
 * Cria e configura a janela principal (BrowserWindow) da Kaelara no Electron.
 *
 * Configurações de segurança:
 * - `contextIsolation: true`: Garante isolamento estrito entre o script de preload e o contexto do frontend.
 * - `nodeIntegration: false`: Impede execução direta de APIs nativas do Node.js no renderer para máxima segurança.
 * - `preload`: Injeta a ponte de comunicação segura do contexto principal.
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Em modo de desenvolvimento, carrega o servidor Vite local; em produção carrega os arquivos compilados
  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
  mainWindow.loadURL(devUrl);

  // Limpa a referência ao fechar a janela
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Inicialização do ciclo de vida da aplicação quando o Electron estiver pronto.
 */
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

/**
 * Encerra o processo da aplicação quando todas as janelas forem fechadas (exceto no macOS).
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

/**
 * Handler IPC para solicitações de privilégios e permissões de hardware.
 *
 * Exibe uma caixa de diálogo nativa do sistema operacional para o usuário confirmar
 * ou rejeitar ações com impacto no hardware ou dados sensíveis.
 *
 * @param {Electron.IpcMainInvokeEvent} event - Evento invocador do IPC.
 * @param {string} action - Descrição da ação que requer autorização.
 * @returns {Promise<boolean>} Retorna `true` se o usuário autorizou a operação; caso contrário, `false`.
 */
ipcMain.handle('request-permission', async (event, action) => {
  const { response } = await dialog.showMessageBox({
    type: 'question',
    buttons: ['Permitir', 'Negar'],
    title: 'Permissão requerida',
    message: `Kaelara deseja executar: ${action}. Você permite?`,
  });
  return response === 0; // true se o usuário selecionou 'Permitir'
});
