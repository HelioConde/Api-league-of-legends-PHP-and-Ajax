<div align="center">
  <h1>🎮 League Friends — Riot API com PHP e AJAX</h1>
  <p><strong>Estudo de integração com dados de League of Legends usando PHP, JavaScript e chamadas HTTP.</strong></p>
  <p><img alt="PHP" src="https://img.shields.io/badge/PHP-Backend-777BB4?logo=php&logoColor=white"> <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript%20%2B%20AJAX-Frontend-F7DF1E?logo=javascript&logoColor=black"> <img alt="Status" src="https://img.shields.io/badge/status-legado-64748b"></p>
</div>

## Objetivo

O projeto explora como apresentar informações de League of Legends em uma interface web e consultar serviços externos por meio de requisições AJAX. A entrada HTML histórica usa o título **League Friends** e a pasta `php/` reúne implementações relacionadas à API Riot e cache.

**Estado:** exercício antigo. Rotas, versões de endpoints e autenticação devem ser revalidadas antes de qualquer teste com a API atual.

## Estrutura

| Caminho | Função |
| --- | --- |
| `index.html` | Interface League Friends |
| `index.php` | Entrada da parte PHP |
| `php/php-riot-api.php` | Código de integração histórico |
| `php/summoner.php` | Consulta de invocador (API legada) |
| `php/FileSystemCache.php` | Cache em arquivos |
| `js/`, `css/` | Scripts e estilos |
| `view/`, `img/`, `iconIMG/` | Páginas e mídia |

## Executar e estudar

Para abrir as rotas PHP localmente, use **PHP instalado** e sirva a raiz do repositório:

```bash
git clone https://github.com/HelioConde/Api-league-of-legends-PHP-and-Ajax.git
cd Api-league-of-legends-PHP-and-Ajax
php -S 127.0.0.1:8000
```

Acesse `http://127.0.0.1:8000`.

> Não é garantido que consultas Riot funcionem sem adaptação. Antes de chamar a API, revise os endpoints e as regras de autenticação na [documentação oficial](https://developer.riotgames.com/).

## Cuidados antes de retomar

- **Nunca publique uma Riot API key** em JavaScript público, arquivos versionados, screenshots ou logs.
- O projeto histórico possui arquivos JavaScript relacionados a tokens/versões. **Audite-os e revogue quaisquer credenciais antigas expostas**, caso ainda existam.
- Use backend autenticado ou função de servidor para chamar a Riot; limite requisições e trate erros `401`, `403`, `404` e `429`.
- Revise cache, permissões de escrita e validação dos parâmetros recebidos.
- Dados de invocador e regiões mudaram ao longo do tempo: migre somente depois de consultar os endpoints disponíveis hoje.

Este é um projeto independente, sem afiliação oficial com Riot Games. Desenvolvido por [Hélio Conde](https://github.com/HelioConde).
