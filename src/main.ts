import './index.css';
import { mountApp } from './ui/app';

const root = document.getElementById('app');
if (!root) {
  throw new Error('マウント先 #app が見つかりません');
}
mountApp(root);
