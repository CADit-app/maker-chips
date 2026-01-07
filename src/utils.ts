/**
 * Utility for parsing SVG content to CrossSection.
 */

import { svgToPolygons } from '@cadit-app/svg-sampler';
import { embeddedSvgs } from './embeddedSvgs';
import { CrossSection } from '@cadit-app/manifold-3d/manifoldCAD';

/**
 * Parse an SVG pattern name to a CrossSection
 */
export async function parseSvgToCrossSection(
  shapeName: string,
  maxError: number = 0.01
): Promise<CrossSection> {
  // Get the SVG content from embedded SVGs
  const svgContent = embeddedSvgs[shapeName];
  if (!svgContent) {
    throw new Error(`Unknown shape: ${shapeName}. Available shapes: ${Object.keys(embeddedSvgs).join(', ')}`);
  }

  // Sample the SVG into polygons
  const polygons = await svgToPolygons(svgContent, { maxError });

  // Flip the Y-axis for SVG paths (SVG uses Y-down, but 3D modeling uses Y-up)
  const flippedPolygons = polygons.map((polygon) => {
    return polygon.points.map(([x, y]) => [x, -y]) as [number, number][];
  });

  // Create and return a cross-section from the sampled paths
  return new CrossSection(flippedPolygons, 'EvenOdd').simplify(maxError);
}
