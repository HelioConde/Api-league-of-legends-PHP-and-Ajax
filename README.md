# League Friends — Dashboard estático de League of Legends

Versão modernizada e responsiva de um experimento histórico com PHP e AJAX. Agora o painel funciona no GitHub Pages, sem backend, sem banco de dados e sem chave da Riot.

**Atenção:** todos os perfis, ranks, estatísticas e partidas de demonstração são fictícios. Não se trata de um serviço de acompanhamento em tempo real.

## Funcionalidades
- Pesquisa de Riot ID no formato Nome#TAG e navegação por perfis de exemplo.
- Perfil com elo, nível, campeão favorito e resumo das partidas ilustrativas.
- Filtro de partidas por vitória, derrota e campeão.
- Lista local de amigos: adicionar, editar, excluir, selecionar e favoritar.
- Comparação lado a lado entre jogadores, sem inventar valores para IDs desconhecidos.
- Importação, exportação e limpeza de dados locais via JSON.
- Galeria acessível por teclado; layout para celular e movimento reduzido.

## GitHub Pages
Endereço planejado após deploy da branch main:

https://helioconde.github.io/Api-league-of-legends-PHP-and-Ajax/

Caso a publicação ainda esteja desabilitada, entrar em Settings → Pages → Build and deployment → Source e selecionar **GitHub Actions**. O workflow de publicação fica em .github/workflows/deploy.yml.

Não existe build do app: apenas arquivos estáticos com caminhos relativos.

## Iniciar localmente

~~~bash
npm install
npm start
~~~

Abrir http://127.0.0.1:4173

## Testes

~~~bash
npm test
npx playwright install chromium
npm run test:e2e
~~~

O workflow .github/workflows/quality.yml executa Node.js e Playwright no GitHub Actions.

## Estrutura
- index.html: interface e semântica
- css/tokens.css + css/dashboard.css: identidade visual e responsividade
- js/app.js: navegação e interações
- js/core.js: validação e estatísticas
- js/data/demo.js: dados fictícios
- js/services/players.js: provedor de perfis
- js/storage/store.js: persistência e backups
- docs/DESIGN_SYSTEM.md: guia de UI
- docs/ARCHITECTURE.md: decisões técnicas e limitações
- tests/: verificações unitárias e E2E

## Origem e limites
O código PHP e os scripts legados permanecem preservados no repositório para fins históricos, mas não integram a interface publicada. O GitHub Pages não executa PHP.

O armazenamento é apenas local ao navegador; nenhuma conta ou sincronização é fornecida. A futura consulta a dados reais exigirá uma função serverless segura para guardar o token da Riot e respeitar as políticas e limites da API.

Projeto independente, sem vínculo oficial com a Riot Games. Desenvolvido por [Hélio Conde](https://github.com/HelioConde).

## Capturas automáticas de páginas inteiras

O workflow de qualidade salva capturas Playwright em 360, 390, 768, 1280 e 1600px, verifica console, JS, recursos e overflow, e envia uma galeria HTML e os diagnósticos JSON como artefato **league-friends-visual-qa**. As 40 capturas incluem as seis seções e estados extras de amigos preenchidos e perfil sem dados. Veja [docs/QA_VISUAL.md](docs/QA_VISUAL.md).
