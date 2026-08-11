// Custom asset rule guard: allowed formats are storage-only until an admin review approves a later runtime asset pipeline.
const allowedMimeTypes = new Set(["model/gltf-binary", "model/gltf+json", "application/octet-stream", "image/png", "image/jpeg", "image/webp"]);
const allowedExtensions = new Set(["glb", "gltf", "png", "jpg", "jpeg", "webp"]);
export const maxCustomAssetBytes = 5 * 1024 * 1024;

export function validateCustomAsset(input: { originalName: string; mimeType: string; byteSize: number }) {
  const safeName = input.originalName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180);
  const extension = safeName.split(".").pop()?.toLowerCase();
  if (!extension || !allowedExtensions.has(extension)) throw new Error("Only GLB, GLTF, PNG, JPG and WEBP files are accepted.");
  if (!allowedMimeTypes.has(input.mimeType)) throw new Error("The submitted file MIME type is not permitted.");
  if (!Number.isInteger(input.byteSize) || input.byteSize < 1 || input.byteSize > maxCustomAssetBytes) throw new Error("Custom assets must be between 1 byte and 5 MB.");
  return { safeName, extension };
}

