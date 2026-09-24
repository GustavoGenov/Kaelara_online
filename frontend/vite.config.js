import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Configuração de empacotamento e compilação do Vite para o ecossistema frontend da Kaelara.
 *
 * Configura o plugin oficial `@vitejs/plugin-react` para permitir compilação rápida via esbuild,
 * Fast Refresh / HMR (Hot Module Replacement) instantâneo durante o desenvolvimento e geração
 * otimizada de assets estáticos de produção.
 *
 * @see https://vite.dev/config/
 */
export default defineConfig({
  plugins: [react()],
})
