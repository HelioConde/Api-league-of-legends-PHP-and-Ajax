import {test,expect} from "@playwright/test";
test.beforeEach(async ({page})=>{
  await page.goto("/");
  await page.evaluate(()=>localStorage.clear());
  await page.reload();
});
test("dashboard independente de PHP",async ({page})=>{
  const endpoints=[];
  page.on("request",r=>{if(/\/php\/|riotgames\.com\/lol\//i.test(r.url())) endpoints.push(r.url())});
  await expect(page.locator("#profile-card")).toContainText("AlchemyFlames");
  await expect(page.getByText("Dados fictícios.")).toBeVisible();
  await expect(page.locator("#recent-matches .match-row")).toHaveCount(3);
  expect(endpoints).toEqual([]);
});
test("busca, desconhecidos e perfil fictício",async ({page})=>{
  await page.locator("#riot-id").fill("OutroNome#BR1");
  await page.locator("#search-form button").click();
  await expect(page.locator("#profile-card")).toContainText("Sem estatísticas");
  await page.locator("#riot-id").fill("AhriMain#BR1");
  await page.locator("#search-form button").click();
  await expect(page.locator("#profile-card")).toContainText("Diamante");
});
test("favoritos persistem",async ({page})=>{
  await page.locator('[data-profile-action="favorite"]').click();
  await expect(page.locator('[data-profile-action="favorite"]')).toHaveAttribute("aria-pressed","true");
  await page.reload();
  await expect(page.locator('[data-profile-action="favorite"]')).toHaveAttribute("aria-pressed","true");
});
test("amigos: adicionar, editar e excluir",async ({page})=>{
  await page.locator('[data-section="friends"]:visible').first().click();
  await page.locator("#friend-id").fill("NovaAmiga#BR1");
  await page.locator("#friend-form button[type=submit]").click();
  await expect(page.locator("#friend-list")).toContainText("NovaAmiga#BR1");
  await page.reload();
  await page.locator('[data-section="friends"]:visible').first().click();
  await page.locator(".friend-card").filter({hasText:"NovaAmiga#BR1"}).getByRole("button",{name:"Editar"}).click();
  await page.locator("#friend-id").fill("AmigaRenomeada#BR1");
  await page.locator("#friend-form button[type=submit]").click();
  await expect(page.locator("#friend-list")).toContainText("AmigaRenomeada#BR1");
  await page.locator(".friend-card").getByRole("button",{name:"Excluir"}).click();
  await expect(page.locator("#friend-list")).toContainText("Sua lista está vazia");
});
test("filtros de partida e comparação",async ({page})=>{
  await page.locator('[data-section="matches"]:visible').first().click();
  await expect(page.locator("#full-matches .match-row")).toHaveCount(5);
  await page.locator("#match-filter").selectOption("win");
  await expect(page.locator("#full-matches .match-row")).toHaveCount(3);
  await page.locator("#champion-filter").selectOption("Ahri");
  await expect(page.locator("#full-matches .match-row")).toHaveCount(2);
  await page.locator('[data-section="compare"]:visible').first().click();
  await expect(page.locator(".compare-card")).toHaveCount(2);
  await expect(page.locator("#compare-output")).toContainText("Diamante");
});
test("exportar e importar dados",async ({page})=>{
  await page.locator('[data-section="friends"]:visible').first().click();
  await page.locator("#friend-id").fill("BackupTeste#BR1");
  await page.locator("#friend-form button[type=submit]").click();
  await page.locator('[data-section="settings"]:visible').first().click();
  const downloading=page.waitForEvent("download");
  await page.locator("#export-data").click();
  expect((await downloading).suggestedFilename()).toBe("league-friends-backup.json");
  await page.locator("#import-data").setInputFiles({name:"backup.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify({version:2,selected:"AlchemyFlames#BR1",friends:["Importado#BR1"],favorites:[]}))});
  await expect(page.locator("#feedback")).toContainText("Backup importado");
  await page.locator('[data-section="friends"]:visible').first().click();
  await expect(page.locator("#friend-list")).toContainText("Importado#BR1");
  await expect(page.locator("#friend-list")).not.toContainText("BackupTeste#BR1");
});
test("galeria com teclado",async ({page})=>{
  await page.locator('[data-section="gallery"]:visible').first().click();
  await expect(page.locator("#gallery-count")).toHaveText("1 de 6");
  await page.locator("#gallery-widget").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#gallery-count")).toHaveText("2 de 6");
});
for(const width of [360,390,768,1280,1600]){
  test("layout sem rolagem horizontal a "+width+"px",async ({page})=>{
    await page.setViewportSize({width,height:850});
    await expect(page.locator("#profile-card")).toBeVisible();
    const sizes=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
    expect(sizes.scroll).toBeLessThanOrEqual(sizes.client+1);
  });
}
test("movimento reduzido",async ({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.locator('[data-section="gallery"]:visible').first().click();
  await page.locator("#gallery-next").click();
  await expect(page.locator("#gallery-count")).toHaveText("2 de 6");
});

test("menu permanece acessível ao rolar e uma nova seção volta ao início",async ({page})=>{
  const width=page.viewportSize().width;
  await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
  const scroll=await page.evaluate(()=>window.scrollY);
  const selector=width<=780?".mobile-nav":".sidebar";
  const nav=page.locator(selector);
  if(scroll>10){
    const bounds=await nav.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds.y).toBeGreaterThanOrEqual(-1);
    expect(bounds.y).toBeLessThanOrEqual(width<=780?66:2);
  }
  await page.locator('[data-section="friends"]:visible').first().click();
  await expect(page.locator("#panel-friends")).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBeLessThan(8);
});
test("galeria mantém setas no início da imagem mesmo em janela baixa",async ({page})=>{
  await page.setViewportSize({width:1366,height:645});
  await page.locator('[data-section="gallery"]:visible').first().click();
  await expect(page.locator("#gallery-next")).toBeInViewport();
  const stage=await page.locator(".gallery-stage").boundingBox();
  expect(stage).not.toBeNull();
  expect(stage.height).toBeLessThan(330);
});
test("importação tem um único seletor visível e acessível",async ({page})=>{
  await page.locator('[data-section="settings"]:visible').first().click();
  await expect(page.locator('.file-label')).toBeVisible();
  await expect(page.locator('#import-data')).toHaveCount(1);
  await expect(page.locator('#import-filename')).toContainText("Nenhum arquivo selecionado");
});

test("galeria acompanha a imagem central com fundo temático sincronizado",async ({page})=>{
  await page.locator('[data-section="gallery"]:visible').first().click();
  const scene=async()=>page.evaluate(()=>getComputedStyle(document.querySelector(".gallery-stage"),"::before").backgroundImage);
  expect(await scene()).toContain("1.jpg");
  await page.locator("#gallery-next").click();
  expect(await scene()).toContain("2.jpg");
  await expect(page.locator("#gallery-count")).toHaveText("2 de 6");
});

test("favoritar perfil sem adicionar amigo permite reencontrá-lo e filtrar",async({page})=>{
  await page.locator("#riot-id").fill("AhriMain#BR1");
  await page.locator("#search-form button").click();
  await page.locator('[data-profile-action="favorite"]').click();
  await page.locator('[data-section="friends"]:visible').first().click();
  await expect(page.locator("#friend-list")).toContainText("AhriMain#BR1");
  await expect(page.locator("#friend-list")).toContainText("Favorito");
  await page.locator("#saved-filter").selectOption("friends");
  await expect(page.locator("#friend-list")).toContainText("Nenhum jogador encontrado");
  await page.locator("#saved-filter").selectOption("favorites");
  await page.locator("#saved-search").fill("notfound");
  await expect(page.locator("#friend-list")).toContainText("Nenhum jogador encontrado");
  await page.locator("#saved-search").fill("Ahri");
  await expect(page.locator("#friend-list")).toContainText("AhriMain#BR1");
  await page.locator(".friend-card").getByRole("button",{name:/Amigo/}).click();
  await expect(page.locator("#saved-summary")).toContainText("1 amigos");
  await page.reload();
  await page.locator('[data-section="friends"]:visible').first().click();
  await expect(page.locator("#friend-list")).toContainText("AhriMain#BR1");
});
test("atalhos de demonstração abrem os perfis diretamente",async({page})=>{
  await page.locator('[data-demo-id="JunglePath#BR1"]').click();
  await expect(page.locator("#profile-card")).toContainText("JunglePath#BR1");
  await expect(page.locator("#riot-id")).toHaveValue("JunglePath#BR1");
});
test("comparação mostra destaque, empate e indisponibilidade sem inventar números",async({page})=>{
  await page.locator('[data-section="compare"]:visible').first().click();
  await expect(page.locator("#compare-insight")).toContainText("Maior taxa de vitória: AhriMain#BR1");
  await page.locator("#compare-b").selectOption("AlchemyFlames#BR1");
  await expect(page.locator("#compare-insight")).toContainText("Selecione dois jogadores diferentes");
  await page.locator("#compare-b").selectOption("AhriMain#BR1");
  await expect(page.locator("#compare-insight .insight-bar")).toHaveCount(2);
});
