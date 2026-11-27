#!/usr/bin/env node
/**
 * Copies only runtime web assets into ./www for lean Capacitor Android .aab bundles.
 * Keeps GitHub Pages root files clean without duplicating scripts, docs, or store graphics.
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const WWW = path.join(ROOT, 'www');

const FILES = ['index.html', 'manifest.json', 'privacy-policy.html'];
const DIRS = [
  'css',
  'js',
  'assets/sprites',
  'assets/sheets',
  'assets/scenes',
  'assets/videos',
  'assets/audio',
  'assets/icons',
];

fs.rmSync(WWW, { recursive: true, force: true });
fs.mkdirSync(WWW, { recursive: true });

for (const file of FILES) {
  const src = path.join(ROOT, file);
  const dst = path.join(WWW, file);
  if (fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
}

for (const dir of DIRS) {
  const src = path.join(ROOT, dir);
  const dst = path.join(WWW, dir);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dst, { recursive: true });
  }
}

console.log('Synced lean web bundle into ./www');
