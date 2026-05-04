<div align="center">
  <img src="https://raw.githubusercontent.com/educsj/NextBook/main/assets/icon.png" width="96" alt="NextBook logo" />
  <h1>NextBook</h1>
  <p><strong>Your personal bookshelf, always with you.</strong></p>
  <p><em>Sua biblioteca pessoal, sempre com você.</em></p>

  <p>
    <img src="https://img.shields.io/badge/platform-Android-3DDC84?logo=android&logoColor=white" />
    <img src="https://img.shields.io/badge/Expo-54-000020?logo=expo&logoColor=white" />
    <img src="https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react&logoColor=white" />
    <img src="https://img.shields.io/badge/license-MIT-blue" />
  </p>
</div>

---

## 🇺🇸 English

NextBook is a free, offline-first Android app for managing your personal book collection. Scan barcodes, search by title, track your reading progress, and never lose your library.

### Features

- **ISBN Scanner** — Scan the barcode and get book info instantly from multiple sources
- **Multi-API Search** — Google Books → BrasilAPI (CBL) → OpenLibrary → Apple Books, with automatic fallback
- **Manual Entry** — Add any book manually when no API finds it
- **Reading Progress** — Track pages read and completion percentage
- **Dark Mode** — Full dark/light/system theme support
- **Multilingual** — Portuguese 🇧🇷 and English 🇺🇸, persisted across sessions
- **Star Rating & Notes** — Rate books and write personal annotations
- **Loan Tracking** — Record who you lent a book to and when
- **Randomizer** — Can't decide what to read next? Let the app pick for you
- **Backup & Restore** — Export/import your library as a JSON file
- **Cover Photo** — Take a photo or pick from gallery to set a custom cover
- **Offline Storage** — All data stored locally with WatermelonDB, no account needed

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.81 + Expo SDK 54 |
| UI | NativeWind v4 (Tailwind CSS) |
| Database | WatermelonDB 0.28 (SQLite) |
| Navigation | React Navigation v7 |
| State | Zustand v5 |
| i18n | i18next + react-i18next |
| Animations | React Native Reanimated 4 |
| Scanner | expo-camera |
| Images | expo-image-picker |

### Getting Started

```bash
# Clone the repo
git clone https://github.com/educsj/NextBook.git
cd NextBook

# Install dependencies
npm install --legacy-peer-deps

# Start dev server
npx expo start
```

> Requires [Node.js 18+](https://nodejs.org) and [Expo Go](https://expo.dev/go) or a local Android build.

### Build APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Build APK (preview profile)
eas build -p android --profile preview
```

---

## 🇧🇷 Português

NextBook é um app Android gratuito e offline-first para gerenciar sua coleção pessoal de livros. Escaneie códigos de barras, busque por título, acompanhe seu progresso de leitura e nunca perca sua biblioteca.

### Funcionalidades

- **Scanner de ISBN** — Escaneie o código de barras e obtenha informações do livro instantaneamente
- **Busca Multi-API** — Google Books → BrasilAPI (CBL) → OpenLibrary → Apple Books, com fallback automático
- **Cadastro Manual** — Adicione qualquer livro manualmente quando nenhuma API encontrar
- **Progresso de Leitura** — Acompanhe páginas lidas e percentual de conclusão
- **Modo Escuro** — Suporte completo a tema escuro/claro/sistema
- **Multilíngue** — Português 🇧🇷 e Inglês 🇺🇸, persistido entre sessões
- **Avaliação e Notas** — Avalie livros com estrelas e escreva anotações pessoais
- **Controle de Empréstimos** — Registre para quem emprestou e quando
- **Sorteador** — Não sabe o que ler? Deixe o app escolher por você
- **Backup e Restauração** — Exporte/importe sua biblioteca em JSON
- **Foto da Capa** — Tire uma foto ou escolha da galeria para personalizar a capa
- **Armazenamento Local** — Dados salvos localmente com WatermelonDB, sem conta necessária

### Tecnologias

| Camada | Tecnologia |
|---|---|
| Framework | React Native 0.81 + Expo SDK 54 |
| UI | NativeWind v4 (Tailwind CSS) |
| Banco de dados | WatermelonDB 0.28 (SQLite) |
| Navegação | React Navigation v7 |
| Estado | Zustand v5 |
| i18n | i18next + react-i18next |
| Animações | React Native Reanimated 4 |
| Scanner | expo-camera |
| Imagens | expo-image-picker |

### Como rodar

```bash
# Clone o repositório
git clone https://github.com/educsj/NextBook.git
cd NextBook

# Instale as dependências
npm install --legacy-peer-deps

# Inicie o servidor de desenvolvimento
npx expo start
```

### Gerar APK

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

---

## License / Licença

MIT © [Eduardo Coutinho](https://github.com/educsj)
