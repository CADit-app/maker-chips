/**
 * Disk generation utilities for Makerchip.
 */

import { CrossSection, Manifold } from '@cadit-app/manifold-3d/manifoldCAD';
import { parseSvgToCrossSection } from './utils';
import { scaleToSizeAndCenter } from './crossSectionUtils';

const REVOLVE_SEGMENTS = 180;

/**
 * Generates a profile to revolve a disk shape with rounded edges
 */
export function generateDiskProfile({
  radius,
  roundingRadius,
  height,
}: {
  radius: number;
  roundingRadius: number;
  height: number;
}): CrossSection {
  // Clamp rounding radius to half height
  const clampedRounding = Math.min(roundingRadius, height / 2);

  // Position two circles for rounded corners
  const circle1 = CrossSection.circle(clampedRounding, 24).translate([radius - clampedRounding, clampedRounding]);
  const circle2 = CrossSection.circle(clampedRounding, 24).translate([radius - clampedRounding, height - clampedRounding]);

  // Create rectangles to fill shape between circles
  const fillRect = CrossSection.square([clampedRounding, height - clampedRounding * 2], true)
    .translate([radius - clampedRounding / 2, height / 2]);

  // Rectangle to fill from center of disk to rounded edge
  const fillRect2 = CrossSection.square([radius - clampedRounding, height]);

  // Union to create the disk profile
  return circle1.add(circle2).add(fillRect).add(fillRect2);
}

/**
 * Creates a rounded disk shape by revolving a profile
 */
export function roundedDisk({
  radius,
  roundingRadius,
  height,
}: {
  radius: number;
  roundingRadius: number;
  height: number;
}): Manifold {
  const profile = generateDiskProfile({ radius, roundingRadius, height });
  return profile.revolve(REVOLVE_SEGMENTS);
}

/**
 * Rounds the edges of any disk shape.
 */
export function roundDiskEdges({
  original,
  radius,
  roundingRadius,
  height,
}: {
  original: Manifold;
  radius: number;
  roundingRadius: number;
  height: number;
}): Manifold {
  // Create a larger unrounded disk
  const offset = 10;
  const largerDisk = CrossSection.square([radius + offset, height + offset]).revolve();

  // Create a rounded disk with required measurements
  const roundedDiskShape = roundedDisk({ radius, roundingRadius, height });

  // Subtract the rounded disk from the larger disk to create a hole with rounded edges
  const roundedHoleShape = largerDisk.subtract(roundedDiskShape);

  // Finally, subtract the rounded hole from the original shape
  return original.subtract(roundedHoleShape);
}

/**
 * Generates a marking shape by parsing an SVG and extruding it to a specified height.
 */
export async function generateMarkingShape({
  shapeName,
  radius,
  roundingRadius,
  height,
}: {
  shapeName: string;
  radius: number;
  roundingRadius: number;
  height: number;
}): Promise<Manifold> {
  const shape = await parseSvgToCrossSection(shapeName);

  // Resize - make slightly bigger to overlap with rounding edges cut
  const sizeOffset = 0.1;
  const sizedShape = scaleToSizeAndCenter(
    shape,
    radius * 2 + sizeOffset,
    radius * 2 + sizeOffset
  );

  // Extrude
  const extrudedShape = sizedShape.extrude(height);

  // Round edges
  const roundedShape = roundDiskEdges({
    original: extrudedShape,
    radius,
    roundingRadius,
    height,
  });

  return roundedShape;
}

/**
 * Generates the center disk for the chip.
 */
export function generateCenterDisk({
  centerCircleRadius,
  height,
}: {
  centerCircleRadius: number;
  height: number;
}): Manifold {
  // Create a simple cylinder for the center disk
  const circle = CrossSection.circle(centerCircleRadius, 64);
  return circle.extrude(height);
}
