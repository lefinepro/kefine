// public/src/main.ts
import './css/style.css';
import './app';

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