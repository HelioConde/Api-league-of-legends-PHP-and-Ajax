# QA Visual

Playwright fotografa seis seções em seis resoluções: 360×800, 390×844, 768×1024, 1280×800, 1366×645 e 1600×900. São 36 capturas full-page por execução.

Execute npm install, npx playwright install chromium, npm run test:e2e e npm run qa:report.

Artefatos: qa-artifacts/screenshots (PNG), qa-artifacts/reports (JSON), qa-artifacts/index.html (galeria), qa-artifacts/SUMMARY.md (resumo), qa-artifacts/playwright-report (HTML/trace).

Verificações: pageerror, console.error, falhas de recursos locais, scroll horizontal, elementos fora da viewport, cards sobrepostos e IDs duplicados. Falhas de CDNs externas são registradas como avisos, não erros do aplicativo.

A execução CI gera o artifact league-friends-visual-qa inclusive quando os testes são aprovados. As capturas permitem inspeção visual humana adicional.

## Estados extras após inspeção das primeiras imagens

Além das 30 telas padrão, seis larguras fotografam dois estados adicionais: **amigos preenchidos** (Riot ID salvo localmente) e **perfil desconhecido** (sem estatísticas online). Total esperado: **48 capturas completas**. O teste usa o mesmo esquema JSON e a mesma galeria de artefatos.

A revisão das capturas originais levou a ajustes concretos: seis opções de navegação visíveis em telas de até 520px, Riot ID com TAG sem quebra interna, e barra de pesquisa compacta nas seções secundárias. Os testes adicionais verificam ausência de overflow, de imagens visíveis quebradas e de erros de JavaScript nesses estados.

## Validação de navegação mobile

O Playwright também reprova menus de navegação que tenham conteúdo horizontal oculto, mesmo quando o documento inteiro não apresenta overflow. Todos os seis botões precisam caber na tela para evitar que as opções finais fiquem cortadas. Essa verificação nasceu da inspeção de capturas em 360 px.

## Revisão dos prints fornecidos (1366 × 768, área útil ~645px)
- Sidebar desktop fixa ao rolar, sem esconder opções de navegação.
- Cabeçalho e navegação mobile permanecem disponíveis durante a rolagem.
- Busca compacta nos painéis internos, com texto de orientação apenas na visão geral.
- Galeria dimensionada para a altura disponível, imagem sem corte e setas no topo da imagem.
- Estado vazio dos amigos agora ocupa a largura útil, sem parecer um cartão isolado.
- Perfil sem dados usa avatar neutro, sem insígnia de ranqueada fictícia.
- Importação utiliza apenas um controle de arquivo visual, acessível por teclado.
- Mensagens de operações antigas são limpas ao mudar de seção.
- Inclusa viewport 1366×645 nos testes, que aproxima a área de conteúdo das capturas enviadas.

## Ajuste após as 48 capturas
A galeria usa um cenário desfocado derivado da arte atual atrás da imagem principal (preservada com `object-fit: contain`). A cada avanço, a mesma arte atualiza o fundo. Isso elimina as laterais vazias sem cortar personagens ou ampliar demais a página.
