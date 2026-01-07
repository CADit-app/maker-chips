/**
 * Assembly utilities for composing Makerchip shapes.
 */

import type { Manifold } from '@cadit-app/manifold-3d';
import { roundedDisk, generateMarkingShape, generateCenterDisk } from './disk';
import type { MakerChipParams } from './params';

export type AssemblyType = 'flat' | 'printable';

/**
 * Assembles all shapes for the Makerchip.
 * 
 * @param params - The parameters for the Makerchip
 * @param assemblyType - 'flat' for preview/export, 'printable' for 3D printing
 * @returns An array of Manifold shapes
 */
export async function assembleMakerchipShapes(
  params: MakerChipParams,
  assemblyType: AssemblyType
): Promise<Manifold[]> {
  // Create chip base
  const disk = roundedDisk({
    radius: params.radius,
    roundingRadius: params.roundingRadius,
    height: params.height,
  });

  // Create marking pattern
  const marking = await generateMarkingShape({
    shapeName: params.markings,
    radius: params.radius,
    roundingRadius: params.roundingRadius,
    height: params.height,
  });

  // Create center disk
  const centerDisk = generateCenterDisk({
    centerCircleRadius: params.centerCircleRadius,
    height: params.height,
  });

  // TODO: Add QR code support when embedded parameters work
  // TODO: Add image extrude support when embedded parameters work

  const allShapes: Manifold[] = [];

  if (assemblyType === 'flat') {
    // Spread shapes out for preview
    const offset = 2 * params.radius + 1;
    allShapes.push(disk);
    allShapes.push(marking.translate([offset, 0, 0]));
    allShapes.push(centerDisk.translate([0, offset, 0]));
  } else if (assemblyType === 'printable') {
    // Stack shapes for printing
    allShapes.push(disk);
    allShapes.push(centerDisk);
    allShapes.push(marking);
  }

  return allShapes;
}
