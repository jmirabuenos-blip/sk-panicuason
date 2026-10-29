const fs = require('fs');
const path = require('path');
const vm = require('vm');
let scripts = 0, missing = [];
for (const dir of ['.', 'admin', 'js']) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (file.endsWith('.js')) { new vm.Script(fs.readFileSync(full,'utf8'), {filename:full}); scripts++; }
    if (!file.endsWith('.html')) continue;
    const content=fs.readFileSync(full,'utf8').replace(/<!--[\s\S]*?-->/g,'');
    for (const match of content.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
      new vm.Script(match[1], {filename:full}); scripts++;
    }
    for (const match of content.matchAll(/(?:src|href)="([^"'<>]+)"/g)) {
      const url=match[1];
      if (!url || /^(https?:|data:|mailto:|tel:|#)/.test(url) || url.includes(' + ')) continue;
      const target=path.resolve(dir,decodeURIComponent(url.split('#')[0].split('?')[0]));
      if (!fs.existsSync(target)) missing.push(`${full}: missing ${url}`);
    }
  }
}
if (missing.length) { console.error(missing.join('\n')); process.exit(1); }
console.log(`Validated ${scripts} scripts and local HTML asset/link targets.`);
