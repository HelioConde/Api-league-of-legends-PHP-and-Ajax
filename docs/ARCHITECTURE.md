# Arquitetura e limites

## Dois cenários de dados
A entrega atual no GitHub Pages é uma demonstração estática. Todos os perfis, ranks e partidas do arquivo js/data/demo.js são inventados e exibidos como tal. IDs digitados que não estejam na lista demo podem ser armazenados, mas suas estatísticas ficam indisponíveis.

Não existe login, banco de dados, envio de mensagens, sincronização entre navegadores, nem chamadas à API Riot.

## Fluxo de arquivos
- index.html define landmarks, formulários e cartões.
- css/tokens.css e css/dashboard.css definem visual e responsividade.
- js/app.js conecta navegação e eventos.
- js/core.js valida Riot ID, filtros e estatísticas.
- js/services/players.js adapta o conjunto demonstrativo.
- js/storage/store.js mantém listas/favoritos/seleção no armazenamento local.
- js/data/demo.js contém os registros inventados.

O armazenamento é localStorage. A versão de backup é 2; a importação valida estrutura, tamanho e quantidade de registros.

## Segurança e privacidade
- Nunca publicar chave Riot no GitHub Pages, em HTML, JSON ou JavaScript.
- Dados dinâmicos são escapados antes da inserção no HTML.
- Nenhum perfil desconhecido obtém estatística fictícia como se fosse real.
- A interface nova não depende de scripts legados nem de PHP.
- Os arquivos antigos continuam no histórico do repositório, fora do artefato publicado.
- Não inserir informações sensíveis no armazenamento local.

## Futuro: integração online
A implementação real pode usar uma função serverless (sem banco de dados) como intermediária. As requisições e o segredo da Riot devem permanecer no servidor, com rate limiting, cache, tratamento de erros e observância dos termos da plataforma.

## Deploy
O workflow .github/workflows/deploy.yml cria um artefato com somente os arquivos usados pelo frontend. Para habilitar a publicação, configurar Settings → Pages → Build and deployment → Source: GitHub Actions. As permissões de Actions/Pages no repositório também devem permitir o deploy.

## Garantia de qualidade
Unitários cobrem filtros, Riot IDs, backups e persistência. Playwright cobre funcionalidades, navegação, teclado e tamanhos. Auditoria WCAG completa e leitores de tela devem ser verificados adicionalmente por revisão humana.
