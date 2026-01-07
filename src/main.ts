/**
 * @cadit-app/maker-chips
 * 
 * A customizable maker chip generator with patterns, center circles,
 * and optional embedded QR codes.
 */

import { defineParams } from '@cadit-app/script-params';
import { Manifold } from '@cadit-app/manifold-3d/manifoldCAD';
import { assembleMakerchipShapes, AssemblyType } from './assembly';
import { threeMfExporter } from './threeMfExport';
import { makerChipParamsSchema, MakerChipParams } from './params';

// Re-export for external use
export { assembleMakerchipShapes } from './assembly';
export { makerChipParamsSchema } from './params';
export type { MakerChipParams } from './params';

/**
 * Main entry point using defineParams
 */
export default defineParams({
  params: makerChipParamsSchema,
  exporters: {
    '3mf': threeMfExporter as any,
  },
  main: async (params): Promise<Manifold> => {
    const assemblyType = params.assemblyType as AssemblyType;
    
    // Get all shapes for the assembly
    const allShapes = await assembleMakerchipShapes(params as MakerChipParams, assemblyType);
    
    // Compose all shapes into a single manifold
    return Manifold.compose(allShapes);
  },
});
