import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on('console', (message) => {
  console.log('browser console', message.type(), message.text());
});

await page.goto('http://127.0.0.1:4175/#/task/vpn-demo-1/stages');
await page.waitForTimeout(1200);

console.log('initial url', page.url());
console.log('result panels before', await page.getByTestId('kefine-result-panel').count());
console.log('subtask lists before', await page.getByTestId('kefine-subtask-list').count());
console.log('vpn widget panels before', await page.getByTestId('kefine-vpn-widget-panel').count());
console.log('layout classes before', await page.locator('.kefine-layout').getAttribute('class'));
console.log('screens before', await page.locator('kefine-screen').count());
console.log('article count before', await page.locator('.kefine-order-flow').count());
console.log('body before', (await page.locator('body').innerText()).slice(0, 1200));

await browser.close();
