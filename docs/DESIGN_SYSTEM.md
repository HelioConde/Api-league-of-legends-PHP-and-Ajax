# League Friends — Design System

## Princípios
- **Produto antes de efeitos:** a busca por Riot ID e o perfil selecionado recebem destaque; funções secundárias ficam em seções específicas.
- **Transparência:** partidas, ranks e números de exemplo são sempre identificados como fictícios.
- **Acessibilidade:** rótulos de controles, foco visível, landmarks semânticos, navegação via teclado e suporte a movimento reduzido.
- **Responsividade:** manter toda ação importante dentro de larguras a partir de 360px, sem overflow da página.
- **Segurança:** entradas são validadas e escapadas antes da apresentação; nenhuma chave da Riot no bundle.

## Tokens — css/tokens.css

| Token | Cor / medida | Uso |
| --- | --- | --- |
| --bg | #080f1a | Fundo |
| --bg-raised | #0c1623 | Superfícies |
| --text | #edf3f4 | Texto |
| --muted | #a4b5c0 | Texto secundário |
| --gold | #d4ac65 | Destaques |
| --teal | #5bd6c8 | Navegação e confirmações |
| --green | #67d5a3 | Vitórias |
| --red | #ee8e94 | Derrotas e avisos |
| --radius-md | 16px | Cartões |
| --space-4 | 16px | Espaçamento padrão |
| --focus | box-shadow | Foco visível |

## Componentes
1. **Sidebar / navegação mobile:** seção ativa com aria-current=page; mobile com tab bar horizontal.
2. **Busca:** formulário com label e ajuda, mensagens de erro/status acessíveis.
3. **Perfil:** nome e TAG, ícone com texto alternativo, rank fictício, botões de favorito e amigo.
4. **Resumo:** quatro cartões com rótulo, número e contexto; exibir traço quando não houver dados.
5. **Partidas:** faixa lateral verde/vermelha e rótulo escrito vitória/derrota.
6. **Comparação:** dois perfis lado a lado, sem fabricar valores para IDs desconhecidos.
7. **Galeria:** sem autoplay, setas por clique/teclado, indicadores de posição e prefers-reduced-motion.
8. **Dados locais:** importação de backup JSON validada, exportação e exclusão com confirmação.

## Tipografia
A fonte Inter é opcional; existem fallbacks de sistema. Corpo de 14px, títulos de 24–37px, rótulos em caixa alta e espaçamento entre letras.

## Pontos de quebra
- Até 520px: conteúdo em uma coluna, estatísticas 2×2.
- Até 780px: sidebar oculta e navegação superior móvel.
- Até 1150px: perfil e demais cartões em linhas distintas.

## Quality Assurance
Testes unitários com node --test; E2E com Playwright. Avaliar teclado, contraste, zoom, scroll lateral em 360/390/768/1280/1600 e navegação sem animações. Verificar leitores de tela manualmente.
