// public/src/main.ts
import './css/style.css';
import './app';

// CSS Anchor Positioning Polyfill for older browsers
// https://github.com/oddbird/css-anchor-positioning
if (!CSS.supports('anchor-name', '--foo')) {
  import('@oddbird/css-anchor-positioning/fn').then((module) => {
    module.default();
  });
}

interface AppInfo {
  name: string;
  framework: string;
  buildTool: string;
}

const appInfo: AppInfo = {
  name: 'Kemal Template',
  framework: 'Kemal (Crystal)',
  buildTool: 'Vite + Rollup with TypeScript'
};

console.log(`${appInfo.buildTool} running for ${appInfo.name}`);
console.log('Framework:', appInfo.framework);

// Example of a simple function
const initializeApp = (): void => {
  console.log('Application initialized successfully');
};

initializeApp();