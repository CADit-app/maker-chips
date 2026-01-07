#!/usr/bin/env npx tsx
/**
 * CLI for generating Makerchip models
 * 
 * Usage:
 *   npx tsx cli.ts output.glb
 *   npx tsx cli.ts output.3mf
 *   npx tsx cli.ts output.glb --radius 25 --markings makerChipV5
 */

import { extname, basename } from 'path';
import { writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
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
    // QR Code embedded params
    'qr-enabled': { type: 'boolean', default: false },
    'qr-content': { type: 'string', default: 'https://cadit.app' },
    'qr-size': { type: 'string', default: '18' },
    'qr-height': { type: 'string', default: '1' },
    // Image Extrude embedded params
    'image-enabled': { type: 'boolean', default: false },
    'image-file': { type: 'string' },
    'image-mode': { type: 'string', default: 'sample' },
    'image-height': { type: 'string', default: '1' },
    'image-max-width': { type: 'string', default: '18' },
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

Chip Options:
  -r, --radius <number>        Chip radius in mm (default: 20)
  -h, --height <number>        Extrusion height in mm (default: 3)
  --rounding <number>          Edge rounding radius in mm (default: 1)
  --center-radius <number>     Center circle radius in mm (default: 14)
  -a, --assembly <type>        Assembly type: flat or printable (default: flat)
  -m, --markings <pattern>     Pattern style (default: makerChipV1)

QR Code Options (embedded maker):
  --qr-enabled                 Enable QR code generation
  --qr-content <text>          QR code content (default: https://cadit.app)
  --qr-size <number>           QR code size in mm (default: 18)
  --qr-height <number>         QR code extrusion height in mm (default: 1)

Image Extrude Options (embedded maker):
  --image-enabled              Enable image extrusion
  --image-file <path>          Path to image file (SVG, PNG, JPG)
  --image-mode <trace|sample>  Processing mode (default: sample)
  --image-height <number>      Extrusion height in mm (default: 1)
  --image-max-width <number>   Maximum width in mm (default: 18)

General:
  --help                       Show this help

Available Patterns:
  makerChipV1 through makerChipV20

Examples:
  npx tsx cli.ts chip.glb
  npx tsx cli.ts chip.3mf --markings makerChipV5 --radius 25
  npx tsx cli.ts chip.glb -m makerChipV10 -a printable
  npx tsx cli.ts chip.glb --qr-enabled --qr-content "Hello World"
  npx tsx cli.ts chip.glb --image-enabled --image-file logo.svg
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
  const { getDefaults } = await import('@cadit-app/script-params');
  const { qrCodeParamsSchema } = await import('@cadit-app/qr-code/src/params');
  const { imageExtrudeParamsSchema } = await import('@cadit-app/image-extrude/src/params');

  // Get defaults from the embedded makers' schemas
  const qrCodeDefaults = getDefaults(qrCodeParamsSchema);
  const imageExtrudeDefaults = getDefaults(imageExtrudeParamsSchema);

  // Build QR code embedded params
  const qrCodeSettings = {
    enabled: values['qr-enabled'] ?? false,
    showSettings: false,
    params: {
      ...qrCodeDefaults,
      text: values['qr-content'] || qrCodeDefaults.text,
      size: parseFloat(values['qr-size'] || String(qrCodeDefaults.size)),
      extrudeDepth: parseFloat(values['qr-height'] || String(qrCodeDefaults.extrudeDepth)),
    },
  };

  // Build image extrude embedded params
  const imageExtrudeSettings = {
    enabled: values['image-enabled'] ?? false,
    showSettings: false,
    params: {
      ...imageExtrudeDefaults,
      mode: values['image-mode'] || imageExtrudeDefaults.mode,
      height: parseFloat(values['image-height'] || String(imageExtrudeDefaults.height)),
      maxWidth: parseFloat(values['image-max-width'] || String(imageExtrudeDefaults.maxWidth)),
    },
  };

  // Load image file if specified
  if (values['image-enabled'] && values['image-file']) {
    const imagePath = values['image-file'];
    if (existsSync(imagePath)) {
      const imageData = await readFile(imagePath);
      const base64 = imageData.toString('base64');
      const imageExt = extname(imagePath).toLowerCase();
      const mimeType = imageExt === '.svg' ? 'image/svg+xml' : 
                       imageExt === '.png' ? 'image/png' : 
                       imageExt === '.jpg' || imageExt === '.jpeg' ? 'image/jpeg' : 
                       'application/octet-stream';
      imageExtrudeSettings.params.imageFile = {
        dataUrl: `data:${mimeType};base64,${base64}`,
        fileType: mimeType,
        fileName: basename(imagePath),
      };
      console.log(`Loaded image: ${imagePath}`);
    } else {
      console.warn(`Warning: Image file not found: ${imagePath}`);
    }
  }

  const params = {
    radius: parseFloat(values.radius || '20'),
    height: parseFloat(values.height || '3'),
    roundingRadius: parseFloat(values.rounding || '1'),
    centerCircleRadius: parseFloat(values['center-radius'] || '14'),
    assemblyType: values.assembly || 'flat',
    markings: values.markings || 'makerChipV1',
    qrCodeSettings,
    imageExtrudeSettings,
  };

  console.log('Generating Makerchip with params:', {
    ...params,
    qrCodeSettings: { enabled: qrCodeSettings.enabled, text: qrCodeSettings.params.text },
    imageExtrudeSettings: { enabled: imageExtrudeSettings.enabled, hasImage: !!imageExtrudeSettings.params.imageFile?.dataUrl },
  });

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
