/**
 * CrossSection utility functions for scaling and centering.
 */

import type { CrossSection, Vec2 } from '@cadit-app/manifold-3d';

/**
 * Scales a cross-section to fit within the specified width and height,
 * maintaining aspect ratio and centering the result.
 */
export function scaleToSizeAndCenter(
  crossSection: CrossSection,
  targetWidth: number,
  targetHeight: number
): CrossSection {
  const bounds = crossSection.bounds();
  const currentWidth = bounds.max[0] - bounds.min[0];
  const currentHeight = bounds.max[1] - bounds.min[1];

  if (currentWidth === 0 || currentHeight === 0) {
    return crossSection;
  }

  // Calculate scale to fit within target dimensions
  const scaleX = targetWidth / currentWidth;
  const scaleY = targetHeight / currentHeight;
  const scale = Math.min(scaleX, scaleY);

  // Scale the cross-section
  const scaled = crossSection.scale([scale, scale]);

  // Get new bounds after scaling
  const scaledBounds = scaled.bounds();
  const scaledWidth = scaledBounds.max[0] - scaledBounds.min[0];
  const scaledHeight = scaledBounds.max[1] - scaledBounds.min[1];

  // Center the result
  const offsetX = -scaledBounds.min[0] - scaledWidth / 2;
  const offsetY = -scaledBounds.min[1] - scaledHeight / 2;

  return scaled.translate([offsetX, offsetY]);
}
