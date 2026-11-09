// 文件路径: /cysl-web/app-uniapp/main.js
import { createSSRApp } from 'vue';
import App from './App.vue';

export function createApp() {
  const app = createSSRApp(App);
  return { app };
}
