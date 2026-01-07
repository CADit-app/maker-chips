/**
 * 3MF Exporter for Makerchip.
 * Exports the chip with separate parts for multi-color printing.
 */

// @ts-ignore - No type declarations available
import type { Exporter, ExportResult } from '@cadit-app/script-params';
import type { Manifold } from '@cadit-app/manifold-3d';
// @ts-ignore - No type declarations available
import { to3dmodel, fileForContentTypes, FileForRelThumbnail } from '@jscadui/3mf-export';
import { strToU8, Zippable, zipSync } from 'fflate';
import { assembleMakerchipShapes } from './assembly';
import type { MakerChipParams } from './params';

/**
 * Export the Makerchip as a 3MF file.
 * Always uses the "printable" assembly for proper multi-part export.
 */
export async function threeMfExport(params: MakerChipParams): Promise<ExportResult> {
  // Always use the "printable" assembly for 3MF export
  const shapes = await assembleMakerchipShapes(params, 'printable');

  // Export each shape as a separate mesh
  const meshes = shapes.map((shape, i) => {
    const mesh = shape.getMesh();
    return {
      id: (i + 1).toString(),
      vertices: mesh.vertProperties,
      indices: mesh.triVerts,
      name: `Makerchip-Part-${i + 1}`,
    };
  });

  // Generate a single component, with all meshes as children, in order
  const components = [
    {
      id: meshes.length + 1,
      children: meshes.map((mesh) => ({ objectID: mesh.id })),
      name: 'Makerchip-Assembly',
    },
  ];

  // The main item should reference the components
  const items = components.map((component) => ({
    objectID: component.id,
  }));

  const header = {
    unit: 'millimeter',
    title: 'CADit Makerchip',
    description: 'Makerchip 3MF export',
    application: 'CADit',
  };

  const to3mf = {
    meshes,
    components,
    items,
    precision: 7,
    header,
  };

  // Generate the 3MF XML model
  const model = to3dmodel(to3mf as any);

  // Package the 3MF file using fflate
  const fileForRelThumbnail = new FileForRelThumbnail();
  fileForRelThumbnail.add3dModel('3D/3dmodel.model');

  const files: Zippable = {};
  files['3D/3dmodel.model'] = strToU8(model);
  files[fileForContentTypes.name] = strToU8(fileForContentTypes.content);
  files[fileForRelThumbnail.name] = strToU8(fileForRelThumbnail.content);

  // Set extruders for multi-color printing
  const modelSettingsXml = generateModelSettingsConfig(meshes.length);
  files['Metadata/model_settings.config'] = strToU8(modelSettingsXml);

  const zipFile = zipSync(files);

  return {
    mimeType: 'model/3mf',
    fileName: 'makerchip.3mf',
    data: zipFile.buffer as ArrayBuffer,
  };
}

/**
 * Generate the model_settings.config XML for multi-extruder support.
 */
function generateModelSettingsConfig(partsCount: number): string {
  // Assign extruder numbers 1-4, repeat 4 for any extra parts
  const extruderForPart = (i: number) => (i < 4 ? i + 1 : 4);

  let partsXml = '';
  for (let i = 0; i < partsCount; i++) {
    partsXml += `
    <part id="${i + 1}" subtype="normal_part">
      <metadata key="name" value="Makerchip-Assembly_${i + 1}"/>
      <metadata key="extruder" value="${extruderForPart(i)}"/>
    </part>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<config>
  <object id="${partsCount + 1}">
    <metadata key="name" value="Makerchip-Assembly"/>
    <metadata key="extruder" value="1"/>
    ${partsXml}
  </object>
</config>
`;
}

/**
 * 3MF Exporter for defineParams.
 */
export const threeMfExporter: Exporter<MakerChipParams> = {
  name: '3MF',
  label: 'Download 3MF',
  description: 'Export the Makerchip as a 3MF file for multi-color 3D printing.',
  export: threeMfExport,
};
