/**
 * Assembly utilities for composing Makerchip shapes.
 */

import type { Manifold } from '@cadit-app/manifold-3d';
import { roundedDisk, generateMarkingShape, generateCenterDisk } from './disk';
import type { MakerChipParams } from './params';
import qrCodeMaker from '@cadit-app/qr-code';
import imageExtrudeMaker from '@cadit-app/image-extrude';

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

  // Generate QR code if enabled
  let qrCode: Manifold | undefined;
  if (params.qrCodeSettings?.enabled) {
    try {
      // qrCodeMaker is a callable ScriptModule - call it directly with params
      qrCode = await qrCodeMaker(params.qrCodeSettings.params) as Manifold;
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }

  // Generate image extrude if enabled
  let imageExtrude: Manifold | undefined;
  if (params.imageExtrudeSettings?.enabled) {
    try {
      // imageExtrudeMaker is a callable ScriptModule - call it directly with params
      imageExtrude = await imageExtrudeMaker(params.imageExtrudeSettings.params) as Manifold;
    } catch (error) {
      console.error('Error generating image extrude:', error);
    }
  }

  const allShapes: Manifold[] = [];

  if (assemblyType === 'flat') {
    // Spread shapes out for preview
    const offset = 2 * params.radius + 1;
    allShapes.push(disk);
    allShapes.push(marking.translate([offset, 0, 0]));
    allShapes.push(centerDisk.translate([0, offset, 0]));
    
    if (qrCode) {
      const qrSize = params.qrCodeSettings.params.size || 18;
      allShapes.push(qrCode.translate([-(params.radius + qrSize / 2 + 1), 0, 0]));
    }
    
    if (imageExtrude) {
      const bounds = imageExtrude.boundingBox();
      const height = bounds.max[1] - bounds.min[1];
      allShapes.push(imageExtrude.translate([0, -(params.radius + height / 2 + 1), 0]));
    }
  } else if (assemblyType === 'printable') {
    // Stack shapes for printing
    allShapes.push(disk);
    allShapes.push(centerDisk);
    allShapes.push(marking);
    
    if (qrCode) {
      // QR code is always on top
      const zTranslate = params.height - qrCode.boundingBox().max[2];
      allShapes.push(qrCode.translate([0, 0, zTranslate]));
    }
    
    if (imageExtrude) {
      // Image extrude is always on bottom (flip it)
      allShapes.push(imageExtrude.mirror([1, 0, 0]));
    }
  }

  return allShapes;
}
