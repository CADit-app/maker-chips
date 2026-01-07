#!/usr/bin/env npx tsx
/**
 * CLI for generating Makerchip models
 * 
 * Usage:
 *   npx tsx cli.ts output.glb
 *   npx tsx cli.ts output.3mf
 *   npx tsx cli.ts output.glb --radius 25 --markings makerChipV5
 */

import { extname } from 'path';
import { writeFile } from 'fs/promises';
import { parseArgs } from 'util';
import type { Manifold } from '@cadit-app/manifold-3d';

const SUPPORTED_FORMATS = ['.glb', '.3mf'] as const;
type OutputFormat = (typeof SUPPORTED_FORMATS)[number];

// Parse command line arguments
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    radius: { type: 'string', short: 'r', default: '20' },
    height: { type: 'string', short: 'h', default: '3' },
    rounding: { type: 'string', default: '1' },
    'center-radius': { type: 'string', default: '14' },
    assembly: { type: 'string', short: 'a', default: 'flat' },
    markings: { type: 'string', short: 'm', default: 'makerChipV1' },
    help: { type: 'boolean', default: false },
  },
});

if (values.help || positionals.length === 0) {
  console.log(`
Makerchip Generator CLI

Usage:
  npx tsx cli.ts <output.[glb|3mf]> [options]

Output Formats:
  .glb   3D model (GLTF binary)
  .3mf   3D model for multi-color printing

Options:
  -r, --radius <number>        Chip radius in mm (default: 20)
  -h, --height <number>        Extrusion height in mm (default: 3)
  --rounding <number>          Edge rounding radius in mm (default: 1)
  --center-radius <number>     Center circle radius in mm (default: 14)
  -a, --assembly <type>        Assembly type: flat or printable (default: flat)
  -m, --markings <pattern>     Pattern style (default: makerChipV1)
  --help                       Show this help

Available Patterns:
  makerChipV1 through makerChipV20

Examples:
  npx tsx cli.ts chip.glb
  npx tsx cli.ts chip.3mf --markings makerChipV5 --radius 25
  npx tsx cli.ts chip.glb -m makerChipV10 -a printable
`);
  process.exit(0);
}

const outputFile = positionals[0];
const ext = extname(outputFile).toLowerCase() as OutputFormat;

if (!SUPPORTED_FORMATS.includes(ext)) {
  console.error(`Error: Output file must have one of these extensions: ${SUPPORTED_FORMATS.join(', ')}`);
  console.error(`Got: ${ext}`);
  process.exit(1);
}

async function main() {
  console.log('Initializing manifold...');

  // Initialize manifold-3d (must happen before importing maker modules)
  const manifoldModule = await import('@cadit-app/manifold-3d');
  await manifoldModule.default();

  console.log('Loading Makerchip module...');

  // Import the Makerchip generator
  const makerchipModule = await import('./src/main');

  const params = {
    radius: parseFloat(values.radius || '20'),
    height: parseFloat(values.height || '3'),
    roundingRadius: parseFloat(values.rounding || '1'),
    centerCircleRadius: parseFloat(values['center-radius'] || '14'),
    assemblyType: values.assembly || 'flat',
    markings: values.markings || 'makerChipV1',
  };

  console.log('Generating Makerchip with params:', params);

  if (ext === '.3mf') {
    // Use the 3MF exporter directly
    const { threeMfExport } = await import('./src/threeMfExport');
    const result = await threeMfExport(params as any);
    await writeFile(outputFile, Buffer.from(result.data as ArrayBuffer));
    console.log(`✓ Generated ${outputFile}`);
  } else {
    // Generate the manifold for GLB
    const result = await makerchipModule.default(params) as Manifold;

    if (!result || typeof (result as any).getMesh !== 'function') {
      console.error('Error: Script did not return a valid Manifold object');
      process.exit(1);
    }

    console.log('Converting to GLTF document...');

    // Convert to GLTF document
    const { manifoldToGLTFDoc } = await import('@cadit-app/manifold-3d/lib/scene-builder.js');
    const exportModel = await import('@cadit-app/manifold-3d/lib/export-model.js');
    const doc = await manifoldToGLTFDoc(result as any);

    console.log(`Exporting to ${outputFile}...`);

    // Export to file
    await exportModel.writeFile(outputFile, doc);

    console.log(`✓ Generated ${outputFile}`);
  }
}

main().catch((err) => {
  console.error('Error:', err.message || err);
  process.exit(1);
});
