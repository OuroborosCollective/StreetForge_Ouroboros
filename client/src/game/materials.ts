// StreetForge material factory: wet road and concrete assets are kept tangible; lime and orange remain tactical accents.
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import type { Scene } from "@babylonjs/core/scene";
import { assets } from "./assets";

export const forgeLime = Color3.FromHexString("#C6F13D");
export const signalOrange = Color3.FromHexString("#EF6A2E");
export const asphaltBlue = Color3.FromHexString("#10171E");

export function makeAsphaltMaterial(scene: Scene) {
  const material = new StandardMaterial("wet-asphalt", scene);
  const texture = new Texture(assets.asphalt, scene, true, false);
  texture.uScale = 7;
  texture.vScale = 18;
  material.diffuseTexture = texture;
  material.diffuseColor = Color3.FromHexString("#59636A");
  material.specularColor = Color3.FromHexString("#6F8190");
  material.specularPower = 64;
  return material;
}

export function makeConcreteMaterial(scene: Scene) {
  const material = new StandardMaterial("concrete", scene);
  const texture = new Texture(assets.concrete, scene, true, false);
  texture.uScale = 2;
  texture.vScale = 2;
  material.diffuseTexture = texture;
  material.diffuseColor = Color3.FromHexString("#73808B");
  material.specularColor = Color3.Black();
  return material;
}

export function flatMaterial(scene: Scene, name: string, hex: string, emissive = 0) {
  const material = new StandardMaterial(name, scene);
  const color = Color3.FromHexString(hex);
  material.diffuseColor = color;
  material.specularColor = Color3.Black();
  material.emissiveColor = emissive ? color.scale(emissive) : Color3.Black();
  return material;
}

