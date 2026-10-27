# League Friends 2.0 — Rift Insights

Modernização do projeto histórico Api-league-of-legends-PHP-and-Ajax, agora como aplicação **100% estática** no GitHub Pages, sem PHP obrigatório, banco de dados ou chave Riot no navegador.

## Funcionalidades concluídas nesta branch
- Catálogo Data Dragon pt_BR com versão dinâmica, fallback de reserva e imagens de campeões.
- Busca, filtros por classe, detalhes e favoritos persistidos por navegador.
- Lista de amigos local, migração de dados antigos, importar/exportar JSON e remoção segura.
- Histórico e estatísticas de partidas **fictícias**, com filtros e aviso explícito.
- Responsividade, navegação semântica, foco visível, reduced motion.
- Testes unitários, Playwright em desktop e mobile, workflow de CI e GitHub Pages.

## Desenvolvimento local

    npm install
    npm run dev
    npm run check
    npx playwright install chromium
    npm run test:e2e

## Deploy
Configurar **Settings > Pages > Source: GitHub Actions**. Após merge da branch na main, o workflow publica o site em:

https://helioconde.github.io/Api-league-of-legends-PHP-and-Ajax/

O Vite utiliza base path /Api-league-of-legends-PHP-and-Ajax/ no build.

## Segurança e limites
- GitHub Pages não executa PHP. Os arquivos legados permanecem no repositório como referência, mas não são importados pelo build.
- Consultas de ranking e partidas **reais** exigem um intermediário seguro. Não confundir as partidas fictícias com resultados ao vivo.
- Dados públicos de campeões são consultados no Data Dragon. Se offline, um catálogo de reserva permite navegar.
- Amigos e favoritos são locais ao navegador. Sem conta e sem sincronização automática.
- Revogar qualquer chave Riot historicamente publicada. Excluir token da branch **não remove o histórico Git**.
- Independente e não endossado pela Riot Games.

## Organização
- src/main.js — navegação e componentes
- src/storage.js — persistência e migração segura
- src/catalog.js — Data Dragon e fallback
- src/style.css — tokens e layout
- data/demo.json — partidas demonstrativas
- docs/DESIGN_SYSTEM.md — padrões visuais
- tests — testes automatizados

Criado por [Hélio Conde](https://github.com/HelioConde).
