# svgify-react

Transform SVG files into optimized React components with zero runtime dependencies.

[![npm version](https://badge.fury.io/js/@svgify%2Freact.svg)](https://www.npmjs.com/package/svgify-react)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- ✅ **Zero Runtime Dependencies** - Generated components have no external dependencies
- ✅ **Framework Agnostic Styling** - Works with Tailwind, CSS Modules, styled-components, or plain CSS
- ✅ **TypeScript & JavaScript** - Full TypeScript support with optional JavaScript output
- ✅ **Flexible Usage Modes** - Direct imports, string-based registry, or both
- ✅ **SVGO Optimization** - Automatic SVG optimization with customizable configuration
- ✅ **Post-Generation Hooks** - Run formatters, linters, or any command after generation

## Installation

```bash
npm install -D svgify-react
```

Or with your preferred package manager:

```bash
yarn add -D svgify-react
pnpm add -D svgify-react
```

## Quick Start

### 1. Create Configuration

Create `svgify.config.json` in your project root:

```json
{
  "inputDir": "./raw-icons",
  "outputDir": "./src/icons"
}
```

### 2. Add SVG Files

Place your SVG files in the input directory:

```
raw-icons/
├── dashboard.svg
├── settings.svg
└── user.svg
```

### 3. Generate Components

```bash
npx svgify
```

Or add to your `package.json` scripts:

```json
{
  "scripts": {
    "icons": "svgify"
  }
}
```

Then run:

```bash
npm run icons
```

## Configuration

### Required Fields

- **`inputDir`** - Path to directory containing raw SVG files
- **`outputDir`** - Path where generated components will be saved

### Optional Fields

- **`iconMode`** - Generation mode: `"direct"`, `"registry"`, or `"both"` (default: `"both"`)
- **`typescript`** - Generate TypeScript (`.tsx`) or JavaScript (`.jsx`) files (default: `true`)
- **`className`** - Base className added to all icon components (default: `"icon"`)
- **`postGenerate`** - Command to run after generation (e.g., `"biome format --write src/"`)
- **`svgoConfig`** - Custom SVGO configuration object

### Example Configuration

```json
{
  "inputDir": "./raw-icons",
  "outputDir": "./src/icons",
  "iconMode": "both",
  "typescript": true,
  "className": "icon",
  "postGenerate": "biome format --write src/",
  "svgoConfig": {
    "multipass": true
  }
}
```

## Usage

### Direct Import (Recommended for Performance)

```tsx
import { DashboardIcon, SettingsIcon } from './icons';

function App() {
  return (
    <div>
      <DashboardIcon size={24} className="text-blue-500" />
      <SettingsIcon width={32} height={32} color="#ff0000" />
    </div>
  );
}
```

### Registry Mode (String-based)

Perfect for dynamic icon selection:

```tsx
import { Icon } from './icons';

function App() {
  const iconName = 'dashboard'; // Dynamic!
  
  return (
    <div>
      <Icon icon="dashboard" size={24} className="text-blue-500" />
      <Icon icon={iconName} width={32} color="#ff0000" />
    </div>
  );
}
```

## Component Props

All generated icon components accept these props:

- **`size`** - Sets both width and height
- **`width`** - Custom width
- **`height`** - Custom height (defaults to width if not specified)
- **`color`** - SVG fill color (default: `"currentColor"`)
- **`className`** - CSS classes
- **`style`** - Inline styles
- **`...rest`** - All standard SVG props (onClick, onMouseEnter, etc.)

## Styling Examples

### With Tailwind CSS

```tsx
<Icon icon="dashboard" className="w-6 h-6 text-blue-500 hover:text-blue-700" />
```

### With CSS Modules

```tsx
import styles from './styles.module.css';

<Icon icon="dashboard" className={styles.myIcon} />
```

### With Plain CSS

```css
/* styles.css */
.icon {
  width: 24px;
  height: 24px;
  color: blue;
}
```

```tsx
<Icon icon="dashboard" /> {/* Uses className from config */}
```

## Icon Modes

### `"direct"` Mode
Only generates individual icon components. Best for tree-shaking and when you know exactly which icons you need.

### `"registry"` Mode
Only generates the registry and wrapper component. Best for dynamic icon selection from API/CMS.

### `"both"` Mode (Default)
Generates both direct imports and registry. Maximum flexibility - use the best approach for each use case.

## Programmatic API

You can also use `svgify-react` programmatically:

```js
const { generate } = require('svgify-react');

generate({
  inputDir: './raw-icons',
  outputDir: './src/icons',
  iconMode: 'both',
  typescript: true,
}).then(() => {
  console.log('Icons generated!');
});
```

## Support

- 🐛 [Report Issues](https://github.com/bij7n/svgify-react/issues)
- 💬 [Discussions](https://github.com/bij7n/svgify-react/discussions)
- 📖 [Documentation](https://github.com/bij7n/svgify-react#readme)

---

Made with ❤️ for the React community
