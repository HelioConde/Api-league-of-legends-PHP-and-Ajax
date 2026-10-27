import {defineConfig,devices} from "@playwright/test";
export default defineConfig({
  testDir:"./tests",testMatch:"**/*.spec.js",timeout:45000,
  expect:{timeout:10000},fullyParallel:true,
  forbidOnly:!!process.env.CI,retries:process.env.CI?1:0,workers:process.env.CI?2:undefined,
  reporter:[
    [process.env.CI?"github":"list"],
    ["html",{outputFolder:"qa-artifacts/playwright-report",open:"never"}],
    ["json",{outputFile:"qa-artifacts/playwright-results.json"}]
  ],
  outputDir:"qa-artifacts/test-results",
  use:{baseURL:"http://127.0.0.1:4173",trace:"retain-on-failure",screenshot:"only-on-failure"},
  projects:[
    {name:"desktop-chromium",testIgnore:"**/visual.spec.js",use:{...devices["Desktop Chrome"],viewport:{width:1280,height:800}}},
    {name:"mobile-chromium",testIgnore:"**/visual.spec.js",use:{...devices["Desktop Chrome"],viewport:{width:390,height:844},isMobile:true,hasTouch:true}},
    {name:"visual-qa",testMatch:"**/visual.spec.js",use:{...devices["Desktop Chrome"]}}
  ],
  webServer:{command:"npm run start",url:"http://127.0.0.1:4173/",timeout:30000,reuseExistingServer:!process.env.CI}
});
