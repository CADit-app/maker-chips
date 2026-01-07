/**
 * Parameter schema for the Makerchip generator.
 */

import { svgDataUrls } from './embeddedSvgs';

export const makerChipParamsSchema = {
  radius: {
    type: 'number',
    label: 'Chip Radius (mm)',
    default: 20,
    min: 10,
    max: 100,
  },
  height: {
    type: 'number',
    label: 'Extrusion Height (mm)',
    default: 3,
  },
  roundingRadius: {
    type: 'number',
    label: "Round the chip's edges (mm)",
    default: 1,
    min: 0,
  },
  centerCircleRadius: {
    type: 'number',
    label: 'Center Circle Radius (mm)',
    default: 14,
  },
  assemblyType: {
    type: 'choice',
    label: 'Assembly Type',
    options: [
      { value: 'flat', label: 'Flat (for preview/export)' },
      { value: 'printable', label: 'Assembled (for 3D printing)' },
    ],
    default: 'flat',
  },
  markings: {
    type: 'buttonGrid',
    label: 'Pattern Style',
    options: [
      { value: 'makerChipV1', image: svgDataUrls.makerChipV1 },
      { value: 'makerChipV2', image: svgDataUrls.makerChipV2 },
      { value: 'makerChipV3', image: svgDataUrls.makerChipV3 },
      { value: 'makerChipV4', image: svgDataUrls.makerChipV4 },
      { value: 'makerChipV5', image: svgDataUrls.makerChipV5 },
      { value: 'makerChipV6', image: svgDataUrls.makerChipV6 },
      { value: 'makerChipV7', image: svgDataUrls.makerChipV7 },
      { value: 'makerChipV8', image: svgDataUrls.makerChipV8 },
      { value: 'makerChipV9', image: svgDataUrls.makerChipV9 },
      { value: 'makerChipV10', image: svgDataUrls.makerChipV10 },
      { value: 'makerChipV11', image: svgDataUrls.makerChipV11 },
      { value: 'makerChipV12', image: svgDataUrls.makerChipV12 },
      { value: 'makerChipV13', image: svgDataUrls.makerChipV13 },
      { value: 'makerChipV14', image: svgDataUrls.makerChipV14 },
      { value: 'makerChipV15', image: svgDataUrls.makerChipV15 },
      { value: 'makerChipV16', image: svgDataUrls.makerChipV16 },
      { value: 'makerChipV17', image: svgDataUrls.makerChipV17 },
      { value: 'makerChipV18', image: svgDataUrls.makerChipV18 },
      { value: 'makerChipV19', image: svgDataUrls.makerChipV19 },
      { value: 'makerChipV20', image: svgDataUrls.makerChipV20 },
    ],
    default: 'makerChipV1',
  },
  // TODO: Add embedded qrCodeSettings and imageExtrudeSettings
  // These need to reference external GitHub scripts
} as const;

export type MakerChipParams = {
  radius: number;
  height: number;
  roundingRadius: number;
  centerCircleRadius: number;
  assemblyType: 'flat' | 'printable';
  markings: string;
};
