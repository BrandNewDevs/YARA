// Node's native TypeScript support plus the same text assets Metro bundles.
import { registerHooks } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL && !/\.[a-z]+$/i.test(specifier)) {
      const url = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(url)) return { url: url.href, shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith('file:') && !url.includes('/node_modules/') && /\.(md|jsonl|json)$/.test(url)) {
      const raw = readFileSync(fileURLToPath(url), 'utf8');
      const value = url.endsWith('.json') ? JSON.parse(raw) : raw;
      return { format: 'module', source: `export default ${JSON.stringify(value)};`, shortCircuit: true };
    }
    return next(url, context);
  },
});
