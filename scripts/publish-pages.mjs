/*
 * Публикация собранного сайта (dist/) в ветку gh-pages — GitHub Pages отдаёт её как сайт.
 * Запуск: npm run deploy (сначала собирает, потом публикует). Нужен git и доступ к репозиторию.
 * Когда у токена появится право workflow, можно перейти на автопубликацию через Actions:
 * см. deploy/github-pages.yml и README.
 */
import { cpSync, existsSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const WT = join(ROOT, '.gh-pages');
const git = (...a) => execFileSync('git', a, { cwd: ROOT, stdio: 'inherit' });
const gitIn = (...a) => execFileSync('git', a, { cwd: WT, stdio: 'inherit' });
const has = (ref) => { try { execFileSync('git', ['rev-parse', '--verify', '--quiet', ref], { cwd: ROOT }); return true; } catch { return false; } };

if (!existsSync(join(DIST, 'index.html'))) throw new Error('Нет dist/ — сначала npm run build');
if (existsSync(WT)) git('worktree', 'remove', '--force', WT);

try { git('fetch', 'origin', 'gh-pages'); } catch { /* ветки ещё нет */ }
if (has('origin/gh-pages')) git('worktree', 'add', '-B', 'gh-pages', WT, 'origin/gh-pages');
else git('worktree', 'add', '--orphan', '-b', 'gh-pages', WT);

for (const f of readdirSync(WT)) if (f !== '.git') rmSync(join(WT, f), { recursive: true, force: true });
cpSync(DIST, WT, { recursive: true });
writeFileSync(join(WT, '.nojekyll'), '');

gitIn('add', '-A');
try { gitIn('commit', '-m', `Публикация сайта ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`); }
catch { console.log('Изменений нет — публиковать нечего'); }
gitIn('push', 'origin', 'gh-pages');
git('worktree', 'remove', '--force', WT);
console.log('Готово: ветка gh-pages обновлена');
