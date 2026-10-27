import {defineConfig,devices} from "@playwright/test";
export default defineConfig({
  testDir:"./tests",testMatch:"**/*.spec.js",timeout:30000,expect:{timeout:7000},
  fullyParallel:true,forbidOnly:!!process.env.CI,retries:process.env.CI?2:0,
  reporter:process.env.CI?"github":"list",
  use:{baseURL:"http://127.0.0.1:4173",trace:"retain-on-failure",screenshot:"only-on-failure"},
  projects:[
    {name:"desktop-chromium",use:{...devices["Desktop Chrome"],viewport:{width:1280,height:800}}},
    {name:"mobile-chromium",use:{...devices["Desktop Chrome"],viewport:{width:390,height:844},isMobile:true,hasTouch:true}}
  ],
  webServer:{command:"npm run start",url:"http://127.0.0.1:4173/",timeout:30000,reuseExistingServer:!process.env.CI}
});
