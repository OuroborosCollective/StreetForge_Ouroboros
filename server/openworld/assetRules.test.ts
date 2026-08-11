import { describe, expect, it } from "vitest";
import { maxCustomAssetBytes, validateCustomAsset } from "./assetRules";

describe("StreetForge custom asset rules", () => {
  it("accepts a bounded GLB and sanitizes its name", () => {
    expect(validateCustomAsset({ originalName: "my district model!.glb", mimeType: "model/gltf-binary", byteSize: 2048 })).toEqual({ safeName: "my_district_model_.glb", extension: "glb" });
  });
  it("rejects unapproved formats and excessive size", () => {
    expect(() => validateCustomAsset({ originalName: "run.exe", mimeType: "application/octet-stream", byteSize: 120 })).toThrow();
    expect(() => validateCustomAsset({ originalName: "large.glb", mimeType: "model/gltf-binary", byteSize: maxCustomAssetBytes + 1 })).toThrow();
  });
});

