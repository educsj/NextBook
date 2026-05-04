# Contexto do Next Book

Para o Next Book, recomendo uma stack moderna e muito ágil, focada em entregar o app para Android com excelente performance e funcionamento offline.

Aqui está a sugestão de arquitetura:

1. Base do App e UI
Framework: React Native com Expo. O Expo facilita absurdamente o fluxo de desenvolvimento, a configuração de permissões (como a câmera) e o build final do APK/AAB para Android.

Linguagem: TypeScript. Ajuda a manter a estrutura dos dados (como o modelo do "Livro") bem definida e evita bugs bobos.

Estilização: NativeWind (Tailwind para React Native). É rápido, limpo e permite que você crie a interface sem criar dezenas de arquivos de estilo separados.

Estado Global: Zustand. Muito mais leve e menos burocrático que o Redux. Perfeito para gerenciar a lista de livros, aplicar os filtros de "lidos/não lidos" e controlar a lógica do sorteio.

2. Banco de Dados e Armazenamento (Local-first)
Banco de Dados: WatermelonDB. Ele é construído exatamente para React Native e foca em apps offline. Ele lida muito bem com milhares de registros sem travar a interface, o que é ótimo caso a biblioteca cresça bastante. Uma alternativa mais simples seria o react-native-mmkv junto com AsyncStorage, mas o WatermelonDB entrega uma estrutura mais robusta para buscas e filtros.

Armazenamento de Imagens: Cache local das capas dos livros no próprio storage do aparelho para não consumir dados toda vez que o usuário abrir a estante.

3. Integrações e Recursos do Aparelho
Leitor de Código de Barras (ISBN): expo-camera. A biblioteca oficial do Expo já tem suporte nativo para ler códigos de barras, facilitando a adição rápida de livros físicos.

Busca de Metadados: Google Books API. É gratuita, não exige chaves complexas para uso básico e retorna capa, autor, número de páginas e sinopse a partir do ISBN ou título.

4. Ambiente de Desenvolvimento
IDE e IA: O combo Cursor com o Claude Code é imbatível para acelerar a criação dos componentes React Native e a lógica do WatermelonDB.

Versionamento: GitHub padrão.

Fluxo de Telas (Sitemap)
Home/Estante: Listagem principal com busca e filtros rápidos.

Detalhes do Livro: Informações completas, edição de notas e avaliação.

Scanner/Adicionar: Interface de câmera para ISBN ou formulário manual.

Sorteador: Tela dedicada com animação para o sorteio do próximo livro.

6. Instruções para Inicialização
Configurar a estrutura básica do Expo com TypeScript e NativeWind.

Instalar e configurar o WatermelonDB para persistência local.

Criar a tipagem para o objeto Book.

Implementar a integração com a Google Books API via fetch.
