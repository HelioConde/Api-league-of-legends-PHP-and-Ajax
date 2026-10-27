import {test,expect} from '@playwright/test';
test.beforeEach(async ({page})=>{
 await page.route('https://ddragon.leagueoflegends.com/**',route=>route.abort());
 await page.goto('/');
});
test('início, catálogo e busca',async ({page})=>{
 await expect(page.getByRole('heading',{name:/Um novo jeito/i})).toBeVisible();
 await page.getByRole('link',{name:'Campeões',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Campeões',exact:true})).toBeVisible();
 await page.getByRole('searchbox',{name:'Buscar campeão'}).fill('Ahri');
 await expect(page.locator('.champ-card')).toHaveCount(1);
});
test('amigos persistem e podem ser removidos',async ({page})=>{
 await page.getByRole('link',{name:'Amigos',exact:true}).click();
 await page.getByRole('textbox',{name:'Nome ou Riot ID'}).fill('Teste#BR1');
 await page.getByRole('button',{name:'+ Adicionar'}).click();
 await expect(page.getByText('Teste#BR1')).toBeVisible();
 await page.reload();
 await expect(page.getByText('Teste#BR1')).toBeVisible();
 await page.getByRole('button',{name:'Remover Teste#BR1'}).click();
 await expect(page.getByText('Teste#BR1')).toHaveCount(0);
});
test('favoritos e detalhe do campeão',async ({page})=>{
 await page.getByRole('link',{name:'Campeões',exact:true}).click();
 await page.getByRole('searchbox',{name:'Buscar campeão'}).fill('Ahri');
 await page.getByRole('button',{name:'Favoritar Ahri'}).click();
 await expect(page.getByRole('button',{name:'Remover Ahri'})).toBeVisible();
 await page.getByRole('link',{name:'Ver Ahri'}).click();
 await expect(page.getByRole('heading',{name:'Ahri',exact:true})).toBeVisible();
});
test('sem scroll horizontal indevido',async ({page})=>{
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBeTruthy();
});
