const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Intercept console messages
  page.on('console', msg => console.log('LOG:', msg.text()));

  await page.goto('http://localhost:3000');
  
  // Wait for the app to load
  await page.waitForTimeout(3000);
  
  // Click the LPJ Tab
  const lpjTab = await page.locator('button:has-text("Laporan Pertanggungjawaban")');
  if (await lpjTab.count() > 0) {
     await lpjTab.click();
     await page.waitForTimeout(1000);
     
     // Evaluate how many .break-after-page elements there are
     const pagesCount = await page.evaluate(() => {
        return document.querySelectorAll('.break-after-page').length;
     });
     console.log("Number of pages in UI:", pagesCount);
     
     const textContent = await page.evaluate(() => {
        return document.querySelector('#document-preview-paper').innerText;
     });
     
     if (textContent.includes("BAB VI. PENUTUP")) {
         console.log("BAB VI IS PRESENT IN DOM!");
     } else {
         console.log("BAB VI IS MISSING FROM DOM!");
     }
  } else {
     console.log("Could not find LPJ tab.");
  }
  
  await browser.close();
})();
