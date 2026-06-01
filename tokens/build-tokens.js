const fs = require('fs');
const path = require('path');

const colorTokens = JSON.parse(fs.readFileSync(path.join(__dirname, 'color-tokens.json'), 'utf8'));
const designTokens = JSON.parse(fs.readFileSync(path.join(__dirname, 'design-tokens.tokens.json'), 'utf8'));

const FALLBACKS = {
  'color.palette.error.0': 'hsl(0, 0%, 0%)',
  'color.palette.error.10': 'hsl(0, 100%, 10%)',
  'color.palette.error.20': 'hsl(0, 100%, 17%)',
  'color.palette.error.30': 'hsl(0, 59%, 29%)',
  'color.palette.error.40': 'hsl(0, 54%, 41%)',
  'color.palette.error.50': 'hsl(0, 49%, 50%)',
  'color.palette.error.60': 'hsl(0, 49%, 59%)',
  'color.palette.error.70': 'hsl(0, 52%, 69%)',
  'color.palette.error.80': 'hsl(0, 81%, 81%)',
  'color.palette.error.90': 'hsl(0, 100%, 92%)',
  'color.palette.error.95': 'hsl(0, 100%, 96%)',
  'color.palette.error.99': 'hsl(0, 50%, 99%)',
  'color.palette.error.100': 'hsl(0, 0%, 100%)',
  'color.palette.neutral.4': 'hsl(0, 0%, 4%)',
  'color.palette.neutral.6': 'hsl(180, 2%, 6%)',
  'color.palette.neutral.12': 'hsl(0, 0%, 12%)',
  'color.palette.neutral.17': 'hsl(0, 0%, 17%)',
  'color.palette.neutral.22': 'hsl(0, 0%, 22%)',
  'color.palette.neutral.24': 'hsl(0, 0%, 24%)',
};

function resolveRef(ref, data) {
  const parts = ref.slice(1, -1).split('.');
  let current = data;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return FALLBACKS[parts.join('.')] || null;
    }
  }
  return typeof current === 'string' ? current : (FALLBACKS[parts.join('.')] || null);
}

function resolveRoles(roles, data) {
  const result = {};
  for (const [mode, modeRoles] of Object.entries(roles)) {
    result[mode] = {};
    for (const [role, value] of Object.entries(modeRoles)) {
      if (typeof value === 'string' && value.startsWith('{')) {
        result[mode][role] = resolveRef(value, data);
      } else {
        result[mode][role] = value;
      }
    }
  }
  return result;
}

const resolvedRoles = resolveRoles(colorTokens.color.role, colorTokens);

let css = '/* Auto-generated from design tokens */\n';

css += '\n:root {\n';
for (const [role, value] of Object.entries(resolvedRoles.light)) {
  const prop = '--color-' + role.replace(/([A-Z])/g, '-$1').toLowerCase();
  css += `  ${prop}: ${value};\n`;
}
css += '}\n';

css += '\n[data-theme="dark"] {\n';
for (const [role, value] of Object.entries(resolvedRoles.dark)) {
  const prop = '--color-' + role.replace(/([A-Z])/g, '-$1').toLowerCase();
  css += `  ${prop}: ${value};\n`;
}
css += '}\n';

const typography = designTokens.typography;

css += '\n:root {\n';
for (const [_category, styles] of Object.entries(typography)) {
  for (const [styleName, props] of Object.entries(styles)) {
    const name = styleName.toLowerCase().replace(/\s+/g, '-');
    for (const [propKey, propVal] of Object.entries(props)) {
      const propKebab = propKey.replace(/([A-Z])/g, '-$1').toLowerCase();
      let val = propVal.value;
      if (propVal.type === 'dimension' && typeof val === 'number') {
        val = `${val}px`;
      }
      if (propKey === 'fontFamily' && typeof val === 'string') {
        val = `'${val}'`;
      }
      css += `  --${name}-${propKebab}: ${val};\n`;
    }
  }
}
css += '}\n';

fs.writeFileSync(path.join(__dirname, 'tokens.css'), css);
console.log('Generated tokens.css');
