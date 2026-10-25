# Riot API com PHP e AJAX — experimento legado

**Exercício de consumo da API Riot Games usando PHP no servidor e requisições AJAX no navegador.**

## Objetivo

Demonstrar a separação entre uma chamada HTTP autenticada no backend e a apresentação da resposta em uma página web.

## Estrutura

- `index.php` e `php/` — rotinas de servidor.
- `index.html`, `js/`, `css/` — interface e scripts do navegador.
- `img/`, `view/` — telas e recursos auxiliares.

## Como explorar

Execute em um servidor PHP local, revise as rotas existentes e configure uma **Riot API key válida exclusivamente no servidor**. Nunca coloque tokens secretos em HTML, JavaScript público ou commits.

> **Projeto histórico:** endpoints, regiões, parâmetros e métodos de autenticação da Riot mudam. O exemplo original não deve ser considerado uma integração pronta e atualizada. Consulte a [documentação oficial Riot Developer Portal](https://developer.riotgames.com/) e adapte-o antes de executar.

## Próximos passos

- Atualizar as rotas conforme os endpoints vigentes.
- Tratar erros 403/404/429 e expiração de chaves.
- Padronizar respostas JSON e testes.
- Mover credenciais para variáveis de ambiente.

Projeto independente e não endossado pela Riot Games. Criado por [Hélio Conde](https://github.com/HelioConde).
