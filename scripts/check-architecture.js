#!/usr/bin/env node
/*
 * Verifies the Clean Architecture dependency rule by scanning import statements:
 *   domain          -> imports nothing outside domain
 *   application     -> imports domain/application only (+ @nestjs/common for DI decorators)
 *   infrastructure  -> never imports presentation
 *   presentation    -> never imports infrastructure
 * Usage: npm run check:architecture
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const LAYERS = ['domain', 'application', 'infrastructure', 'presentation'];

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.name.endsWith('.ts') ? [full] : [];
  });

const layerOf = (file) => {
  const first = path.relative(SRC, file).split(path.sep)[0];
  return LAYERS.includes(first) ? first : null;
};

const importedLayerOf = (file, specifier) => {
  const alias = specifier.match(/^@(domain|application|infrastructure|presentation)(?:\/|$)/);
  if (alias) return alias[1];
  if (specifier.startsWith('.')) return layerOf(path.resolve(path.dirname(file), specifier));
  return null;
};

const importsOf = (source) => {
  const specifiers = [];
  const pattern = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = pattern.exec(source))) specifiers.push(match[1] || match[2]);
  return specifiers;
};

const violations = [];

for (const file of walk(SRC)) {
  const layer = layerOf(file);
  if (!layer) continue;

  for (const specifier of importsOf(fs.readFileSync(file, 'utf8'))) {
    const relativeFile = path.relative(SRC, file);
    const target = importedLayerOf(file, specifier);

    const forbiddenLayer =
      (layer === 'domain' && target && target !== 'domain') ||
      (layer === 'application' && target && !['application', 'domain'].includes(target)) ||
      (layer === 'infrastructure' && target === 'presentation') ||
      (layer === 'presentation' && target === 'infrastructure');
    if (forbiddenLayer) {
      violations.push(`${relativeFile}: ${layer} must not import ${target} ("${specifier}")`);
    }

    const isExternal = !specifier.startsWith('.') && target === null;
    const allowedPackage = layer === 'application' && specifier === '@nestjs/common';
    if (isExternal && (layer === 'domain' || layer === 'application') && !allowedPackage) {
      violations.push(`${relativeFile}: ${layer} must not import the package "${specifier}"`);
    }
  }
}

if (violations.length > 0) {
  console.error(`Architecture violations (${violations.length}):\n- ${violations.join('\n- ')}`);
  process.exit(1);
}
console.log('Architecture OK: the dependency rule holds in every layer.');
