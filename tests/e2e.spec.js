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
