/**
 * @svgify/react - Convert SVG files to React components
 * Main entry point for programmatic API
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { type Config as SVGOConfig, optimize } from 'svgo';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export interface SvgifyConfig {
  /** Path to directory containing raw SVG files (REQUIRED) */
  inputDir: string;
  /** Path where generated components will be saved (REQUIRED) */
  outputDir: string;
  /** Generation mode: "direct", "registry", or "both" */
  iconMode?: 'direct' | 'registry' | 'both';
  /** Generate TypeScript (.tsx) or JavaScript (.jsx) files */
  typescript?: boolean;
  /** Base className added to all icon components */
  className?: string;
  /** Command to run after generation (e.g., "biome format --write src/") */
  postGenerate?: string;
  /** Custom SVGO configuration */
  svgoConfig?: SVGOConfig;
}

interface ProcessedIcon {
  originalFile: string;
  sanitizedName: string;
  componentName: string;
  camelCaseName: string;
  svgContent: string;
  optimizedSvg: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: Partial<SvgifyConfig> = {
  iconMode: 'both',
  typescript: true,
  className: 'icon',
  postGenerate: '',
  svgoConfig: {
    multipass: true,
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            removeViewBox: false,
            inlineStyles: { onlyMatchedOnce: false },
          },
        },
      },
      'convertColors',
      {
        name: 'removeAttrs',
        params: {
          attrs: ['class', 'style', 'data-*', 'width', 'height'],
        },
      },
      {
        name: 'addAttributesToSVGElement',
        params: {
          attributes: [{ fill: 'currentColor' }],
        },
      },
    ],
  },
};

// SVG attribute mapping (kebab-case to camelCase)
const SVG_ATTR_MAP: Record<string, string> = {
  'clip-path': 'clipPath',
  'clip-rule': 'clipRule',
  'fill-rule': 'fillRule',
  'fill-opacity': 'fillOpacity',
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-miterlimit': 'strokeMiterlimit',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-dashoffset': 'strokeDashoffset',
  'stroke-opacity': 'strokeOpacity',
  'stop-color': 'stopColor',
  'stop-opacity': 'stopOpacity',
  'xlink:href': 'xlinkHref',
  'xml:space': 'xmlSpace',
  'xmlns:xlink': 'xmlnsXlink',
};

// ============================================================================
// UTILITIES
// ============================================================================

function ensureDirectoryExists(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function sanitizeFileName(filename: string): string {
  return filename
    .replace('.svg', '')
    .replace(/[\s\-._]+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .toLowerCase();
}

function toPascalCase(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function convertSvgAttributesToCamelCase(svgContent: string): string {
  let result = svgContent;
  Object.entries(SVG_ATTR_MAP).forEach(([kebab, camel]) => {
    const regex = new RegExp(`\\b${kebab.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s*=)`, 'gi');
    result = result.replace(regex, camel);
  });
  return result;
}

// ============================================================================
// ICON PROCESSING
// ============================================================================

async function processIcon(filename: string, config: SvgifyConfig): Promise<ProcessedIcon | null> {
  try {
    if (!filename.endsWith('.svg')) return null;

    const svgPath = path.join(config.inputDir, filename);
    const svgContent = fs.readFileSync(svgPath, 'utf-8');

    // Optimize SVG
    const result = optimize(svgContent, config.svgoConfig || DEFAULT_CONFIG.svgoConfig!);

    const sanitizedName = sanitizeFileName(filename);
    if (!sanitizedName) {
      console.warn(`⚠️  Skipping ${filename}: Invalid filename after sanitization`);
      return null;
    }

    const componentName = `${toPascalCase(sanitizedName)}Icon`;
    const camelCaseName = toCamelCase(sanitizedName);

    // Extract inner SVG content
    let optimizedSvg = result.data
      .replace(/<svg[^>]*>/, '')
      .replace(/<\/svg>/, '')
      .trim()
      .replace(/fill="(?!none|currentColor)[^"]*"/gi, 'fill="currentColor"')
      .replace(/stroke="(?!none|currentColor)[^"]*"/gi, 'stroke="currentColor"');

    optimizedSvg = convertSvgAttributesToCamelCase(optimizedSvg);

    return {
      originalFile: filename,
      sanitizedName,
      componentName,
      camelCaseName,
      svgContent,
      optimizedSvg,
    };
  } catch (error) {
    console.error(`❌ Error processing ${filename}:`, error);
    return null;
  }
}

// ============================================================================
// TEMPLATE GENERATORS
// ============================================================================

function getFileExtension(typescript: boolean): string {
  return typescript ? 'tsx' : 'jsx';
}

function generateIconComponent(icon: ProcessedIcon, config: SvgifyConfig): string {
  const ext = getFileExtension(config.typescript!);
  const isTS = config.typescript;
  const baseClassName = config.className || 'icon';

  return `// Auto-generated component - DO NOT EDIT
${isTS ? "import type { SVGProps } from 'react';" : ''}

${isTS ? 'export ' : ''}interface IconProps extends ${isTS ? 'SVGProps<SVGSVGElement>' : 'React.SVGProps<SVGSVGElement>'} {
  size?: number | string;
  color?: string;
}

/**
 * ${icon.componentName}
 * Original file: ${icon.originalFile}
 */
export const ${icon.componentName}${isTS ? ': React.FC<IconProps>' : ''} = ({ 
  size,
  width,
  height,
  color = 'currentColor',
  className = '',
  style,
  ...props 
}) => {
  const w = size || width || 20;
  const h = size || height || width || 20;
  const combinedClassName = \`${baseClassName} \${className}\`.trim();
  
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 24 24"
      fill={color}
      className={combinedClassName}
      style={{ color, ...style }}
      {...props}
    >
      ${icon.optimizedSvg}
    </svg>
  );
};

${icon.componentName}.displayName = '${icon.componentName}';

export default ${icon.componentName};
`;
}

function generateIconRegistry(icons: ProcessedIcon[], config: SvgifyConfig): string {
  const isTS = config.typescript;
  const iconNames = icons.map((icon) => icon.camelCaseName);

  return `// Auto-generated file - DO NOT EDIT
${isTS ? "import type { FC } from 'react';" : "import { FC } from 'react';"}

// Import all icons
${icons.map((icon) => `import ${icon.componentName} from './${icon.componentName}';`).join('\n')}

export const iconNames = [
${iconNames.map((name) => `  '${name}',`).join('\n')}
]${isTS ? ' as const' : ''};

${isTS ? 'export type IconName = typeof iconNames[number];' : ''}

const iconComponents${isTS ? ': Record<string, FC<any>>' : ''} = {
${icons.map((icon) => `  '${icon.camelCaseName}': ${icon.componentName},`).join('\n')}
};

export function getIconComponent(name${isTS ? ': string' : ''})${isTS ? ': FC<any> | undefined' : ''} {
  return iconComponents[name];
}

export function hasIcon(name${isTS ? ': string' : ''})${isTS ? ': boolean' : ''} {
  return name in iconComponents;
}

export function getAllIconNames()${isTS ? ': string[]' : ''} {
  return Object.keys(iconComponents);
}
`;
}

function generateIconWrapper(config: SvgifyConfig): string {
  const isTS = config.typescript;
  const baseClassName = config.className || 'icon';

  return `// Auto-generated file - DO NOT EDIT
${isTS ? "import type { SVGProps } from 'react';" : ''}
import { getIconComponent } from './IconRegistry';
${isTS ? "import type { IconName } from './IconRegistry';" : ''}

${isTS ? 'export ' : ''}interface IconProps extends ${isTS ? 'SVGProps<SVGSVGElement>' : 'React.SVGProps<SVGSVGElement>'} {
  icon${isTS ? ': IconName' : ''};
  size?: number | string;
  color?: string;
}

export const Icon${isTS ? ': React.FC<IconProps>' : ''} = ({ 
  icon,
  size,
  width,
  height,
  color = 'currentColor',
  className = '',
  style,
  ...props 
}) => {
  const IconComponent = getIconComponent(icon);
  
  if (!IconComponent) {
    console.warn(\`Icon "\${icon}" not found\`);
    return null;
  }

  const w = size || width || 20;
  const h = size || height || width || 20;
  const combinedClassName = \`${baseClassName} \${className}\`.trim();

  return (
    <IconComponent
      width={w}
      height={h}
      color={color}
      className={combinedClassName}
      style={{ color, ...style }}
      {...props}
    />
  );
};

Icon.displayName = 'Icon';
`;
}

function generateIndexFile(icons: ProcessedIcon[], config: SvgifyConfig): string {
  const mode = config.iconMode || 'both';
  
  let exports = '';
  
  if (mode === 'registry' || mode === 'both') {
    exports += `// Registry exports\n`;
    exports += `export { Icon } from './Icon';\n`;
    exports += `export type { IconProps } from './Icon';\n`;
    exports += `export { iconNames, getIconComponent, hasIcon, getAllIconNames } from './IconRegistry';\n`;
    exports += `export type { IconName } from './IconRegistry';\n\n`;
  }
  
  if (mode === 'direct' || mode === 'both') {
    exports += `// Direct component exports\n`;
    exports += icons.map((icon) => `export { default as ${icon.componentName} } from './${icon.componentName}';`).join('\n');
    exports += `\n\n// Total icons: ${icons.length}`;
  }
  
  return `// Auto-generated file - DO NOT EDIT\n${exports}\n`;
}

// ============================================================================
// MAIN GENERATOR
// ============================================================================

export async function generate(userConfig: SvgifyConfig): Promise<void> {
  console.log('🚀 Starting icon generation...\n');

  // Validate required fields
  if (!userConfig.inputDir || !userConfig.outputDir) {
    throw new Error('inputDir and outputDir are required in configuration');
  }

  // Merge with defaults
  const config: SvgifyConfig = { ...DEFAULT_CONFIG, ...userConfig };

  // Ensure directories exist
  ensureDirectoryExists(config.inputDir);
  ensureDirectoryExists(config.outputDir);

  // Check for SVG files
  const files = fs.readdirSync(config.inputDir);
  const svgFiles = files.filter((file) => file.endsWith('.svg'));

  if (svgFiles.length === 0) {
    console.error(`❌ No SVG files found in ${config.inputDir}`);
    process.exit(1);
  }

  console.log(`📁 Found ${svgFiles.length} SVG files\n`);

  // Process icons
  const processedIcons: ProcessedIcon[] = [];
  
  for (const file of svgFiles) {
    process.stdout.write(`Processing ${file}...`);
    const result = await processIcon(file, config);
    
    if (result) {
      processedIcons.push(result);
      console.log(` ✅ (→ ${result.componentName})`);
    } else {
      console.log(` ❌`);
    }
  }

  if (processedIcons.length === 0) {
    console.error('\n❌ No icons were successfully processed');
    process.exit(1);
  }

  console.log('\n📦 Generating files...');

  const ext = getFileExtension(config.typescript!);
  const mode = config.iconMode || 'both';

  // Generate icon components (always needed)
  for (const icon of processedIcons) {
    const componentPath = path.join(config.outputDir, `${icon.componentName}.${ext}`);
    fs.writeFileSync(componentPath, generateIconComponent(icon, config));
  }
  console.log(`   ✅ Generated ${processedIcons.length} icon components`);

  // Generate registry if needed
  if (mode === 'registry' || mode === 'both') {
    const registryPath = path.join(config.outputDir, `IconRegistry.${ext}`);
    fs.writeFileSync(registryPath, generateIconRegistry(processedIcons, config));
    console.log('   ✅ Generated IconRegistry');

    const iconPath = path.join(config.outputDir, `Icon.${ext}`);
    fs.writeFileSync(iconPath, generateIconWrapper(config));
    console.log('   ✅ Generated Icon wrapper');
  }

  // Generate index
  const indexPath = path.join(config.outputDir, `index.${ext === 'tsx' ? 'ts' : 'js'}`);
  fs.writeFileSync(indexPath, generateIndexFile(processedIcons, config));
  console.log('   ✅ Generated index file');

  // Run post-generate command
  if (config.postGenerate) {
    console.log('\n📝 Running post-generate command...');
    try {
      await execAsync(config.postGenerate);
      console.log('   ✅ Post-generate command completed');
    } catch (error: any) {
      console.error('   ❌ Post-generate command failed:', error.message);
    }
  }

  console.log(`\n✨ Icon generation complete!`);
  console.log(`   ✅ Successfully processed: ${processedIcons.length} icons`);
}
