# Projeto Next Book - Instruções de Implementação para IA (Claude Code)

Este documento contém o plano técnico detalhado para a inicialização e configuração do aplicativo **Next Book**, focado em entregar um app *offline-first* para Android usando React Native. O repositório Git já está inicializado e apontado para `https://github.com/educsj/NextBook.git`.

**IA Executor:** Por favor, siga os passos abaixo de forma sequencial. Valide cada etapa antes de prosseguir para a próxima.

## Stack Tecnológica Alvo
- **Framework:** Expo (SDK 51+) com React Native.
- **Linguagem:** TypeScript.
- **Estilização:** NativeWind v4 (ou mais recente).
- **Estado Global:** Zustand.
- **Banco de Dados Local:** WatermelonDB.
- **Integrações:** `expo-camera` (para ISBN) e Google Books API.

---

## Passos para Execução

### Passo 1: Inicialização do Projeto
1. Na raiz do diretório `NextBook`, verifique se você está no contexto correto.
2. Execute o comando de inicialização do Expo para criar o app no diretório atual:
   ```bash
   npx create-expo-app@latest ./ --template blank-typescript
   ```
   *(Pode ser necessário limpar arquivos da pasta atual temporariamente ou forçar a criação caso o Expo reclame do diretório não vazio. O repositório `.git` já existe e NÃO deve ser apagado).*
3. Após a inicialização, limpe a tela inicial (`App.tsx` ou `app/index.tsx` se usar Expo Router) para um componente básico.

### Passo 2: Configuração do NativeWind (TailwindCSS)
*(Nota: Certifique-se de seguir a documentação mais atual do NativeWind para Expo)*
1. Instale as dependências necessárias:
   ```bash
   npm install nativewind tailwindcss react-native-reanimated
   ```
2. Inicialize o Tailwind:
   ```bash
   npx tailwindcss init
   ```
3. Configure o arquivo `tailwind.config.js` para incluir os caminhos dos arquivos do projeto (`./App.{js,jsx,ts,tsx}`, `./src/**/*.{js,jsx,ts,tsx}`).
4. Atualize o `babel.config.js` para incluir o preset/plugin do NativeWind e o plugin do `react-native-reanimated/plugin` (se aplicável na versão atual).
5. Se for NativeWind v4, configure o `metro.config.js` usando `withNativeWind` e crie o arquivo `global.css`.

### Passo 3: Instalação e Configuração do WatermelonDB
*(Atenção: Requer plugins específicos de Babel e configuração de Dev Client)*
1. Instale os pacotes principais:
   ```bash
   npm install @nozbe/watermelondb @nozbe/with-observables
   ```
2. Instale o plugin do Babel para decorators (necessário para os Modelos do WatermelonDB):
   ```bash
   npm install -D @babel/plugin-proposal-decorators
   ```
3. No `babel.config.js`, adicione o plugin: `["@babel/plugin-proposal-decorators", { "legacy": true }]`.
4. **IMPORTANTE:** Como o WatermelonDB usa SQLite nativo, modifique o `app.json` para adicionar o plugin oficial do WatermelonDB (ou documente que será necessário rodar em prebuild).
5. Crie a estrutura inicial do banco em `src/database/`:
   - `schema.ts`: Defina a tabela `books` (campos: id, title, author, isbn, cover_url, total_pages, read_pages, is_read, is_synced, rating, notes).
   - `Book.ts`: Crie a classe do Modelo extendendo `Model` do WatermelonDB.
   - `index.ts`: Exporte a instância de `Database` usando `SQLiteAdapter`.

### Passo 4: Instalação do Zustand e Utilitários
1. Instale o Zustand:
   ```bash
   npm install zustand
   ```
2. Crie uma store básica em `src/store/useBookStore.ts` para gerenciar estados de UI (como "filtro ativo").

### Passo 5: Estruturação de Pastas e Integração de APIs
1. Crie a seguinte estrutura em `src/`:
   - `/components` (UI reutilizável)
   - `/screens` (Telas principais)
   - `/services` (Lógica de fetch)
   - `/database` (WatermelonDB models/schemas)
   - `/store` (Zustand)
   - `/types` (Interfaces TypeScript)
2. Crie o arquivo `src/services/googleBooksApi.ts` contendo uma função base com `fetch` para buscar informações de livros pelo ISBN (Ex: `https://www.googleapis.com/books/v1/volumes?q=isbn:NUMERO`).

### Passo 6: Versionamento (GitHub)
- Após finalizar as configurações iniciais com sucesso, crie um commit com todas as adições de arquivos da base do Expo e configurações iniciais.
- Faça o push inicial para o repositório (`git push -u origin main`).

### Passo 7: Verificação de Compilação
- Rode `npx tsc --noEmit` para garantir que as tipagens do WatermelonDB e componentes estão corretas.
- Deixe o código pronto para que o usuário possa rodar `npx expo run:android` e compilar o Dev Build localmente.
