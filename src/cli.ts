#!/usr/bin/env node

/**
 * @svgify/react CLI
 * Command-line interface for generating React icon components from SVG files
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { generate, type SvgifyConfig } from './index';

const CONFIG_FILE_NAME = 'svgify.config.json';

function loadConfig(): SvgifyConfig | null {
  const configPath = path.join(process.cwd(), CONFIG_FILE_NAME);
  
  if (!fs.existsSync(configPath)) {
    console.error(`❌ Configuration file not found: ${CONFIG_FILE_NAME}`);
    console.log('\n📝 Please create a svgify.config.json file in your project root:');
    console.log('\n{');
    console.log('  "inputDir": "./raw-icons",');
    console.log('  "outputDir": "./src/icons"');
    console.log('}\n');
    console.log('Optional fields:');
    console.log('  - iconMode: "direct" | "registry" | "both" (default: "both")');
    console.log('  - typescript: true | false (default: true)');
    console.log('  - className: string (default: "icon")');
    console.log('  - postGenerate: string (e.g., "biome format --write src/")');
    console.log('  - svgoConfig: object (custom SVGO configuration)\n');
    return null;
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent) as SvgifyConfig;
    
    // Validate required fields
    if (!config.inputDir || !config.outputDir) {
      console.error('❌ Configuration error: inputDir and outputDir are required');
      return null;
    }
    
    return config;
  } catch (error: any) {
    console.error('❌ Failed to parse configuration file:', error.message);
    return null;
  }
}

async function main() {
  console.log('⚡ @svgify/react v1.0.0\n');
  
  const config = loadConfig();
  
  if (!config) {
    process.exit(1);
  }
  
  try {
    await generate(config);
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

main();
