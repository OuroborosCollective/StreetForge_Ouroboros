// StreetForge world layer: each gameplay actor owns simple Babylon geometry; the scene only orchestrates updates.
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import type { Scene } from "@babylonjs/core/scene";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { makeAsphaltMaterial, makeConcreteMaterial, flatMaterial, forgeLime, signalOrange } from "./materials";
import type { GameState } from "./sim";
import { generateDistrictProps } from "./openWorld";

const fromFixed = (value: number) => value / 100;

class FighterVisual {
  readonly root: TransformNode;
  private readonly shadow;
  private readonly body;
  private alive = true;

  constructor(scene: Scene, id: string, hostile: boolean) {
    this.root = new TransformNode(`${id}-root`, scene);
    this.shadow = MeshBuilder.CreateDisc(`${id}-shadow`, { radius: 0.8, tessellation: 24 }, scene);
    this.shadow.rotation.x = Math.PI / 2;
    this.shadow.position.y = 0.04;
    this.shadow.parent = this.root;
    this.shadow.material = flatMaterial(scene, `${id}-shadow-mat`, "#020406");
    const legs = MeshBuilder.CreateCylinder(`${id}-legs`, { height: 0.95, diameterTop: 0.5, diameterBottom: 0.62, tessellation: 8 }, scene);
    legs.position.y = 0.54;
    legs.parent = this.root;
    legs.material = flatMaterial(scene, `${id}-legs-mat`, hostile ? "#332624" : "#171D24");
    this.body = MeshBuilder.CreateCapsule(`${id}-body`, { height: 1.5, radius: 0.42, tessellation: 10 }, scene);
    this.body.position.y = 1.45;
    this.body.parent = this.root;
    this.body.material = flatMaterial(scene, `${id}-body-mat`, hostile ? "#B6492E" : "#2F3B46");
    const head = MeshBuilder.CreateSphere(`${id}-head`, { diameter: 0.58, segments: 12 }, scene);
    head.position.y = 2.42;
    head.parent = this.root;
    head.material = flatMaterial(scene, `${id}-head-mat`, hostile ? "#C98A70" : "#AF7E69");
    const band = MeshBuilder.CreateBox(`${id}-band`, { width: 0.92, height: 0.11, depth: 0.11 }, scene);
    band.position = new Vector3(0, 1.7, 0.43);
    band.parent = this.root;
    band.material = flatMaterial(scene, `${id}-band-mat`, hostile ? "#EF6A2E" : "#C6F13D", 0.35);
  }

  update(x: number, z: number, alive: boolean, tick: number) {
    this.root.position.x = fromFixed(x);
    this.root.position.z = fromFixed(z);
    this.root.position.y = alive ? Math.sin(tick * 0.16 + x) * 0.025 : -0.42;
    if (this.alive !== alive) {
      this.alive = alive;
      this.root.scaling.y = alive ? 1 : 0.32;
    }
    this.body.rotation.z = alive ? Math.sin(tick * 0.11 + z) * 0.04 : 1.2;
  }
}

export class GameWorld {
  private readonly player: FighterVisual;
  private readonly enemies = new Map<string, FighterVisual>();
  private readonly pickups = new Map<string, TransformNode>();

  constructor(private readonly scene: Scene) {
    this.createDistrict();
    this.player = new FighterVisual(scene, "player", false);
    this.player.root.position.z = 7.8;
    ["rivet", "brass", "fuse"].forEach((id) => this.enemies.set(id, new FighterVisual(scene, id, true)));
  }

  private loadOfficialStreetProp() {
    if (typeof window !== "undefined" && window.innerWidth < 720) return;
    window.setTimeout(() => {
      void import("@babylonjs/loaders/glTF").then(() => SceneLoader.ImportMeshAsync("", "https://models.babylonjs.com/", "ExplodingBarrel.glb", this.scene))
        .then((result) => {
          const root = result.meshes[0];
          if (!root) return;
          root.name = "official-babylon-barrel";
          root.position = new Vector3(-5.25, 0, -1.7);
          root.scaling = new Vector3(0.34, 0.34, 0.34);
          root.rotation.y = -0.42;
          root.metadata = { source: "BabylonJS/MeshesLibrary", license: "CC BY 4.0", role: "decorative_street_prop" };
        })
        .catch(() => {
          // The generated district remains fully playable when the optional CDN prop cannot load.
        });
    }, 600);
  }

  private createDistrict() {
    const ambient = new HemisphericLight("night-ambient", new Vector3(0, 1, 0), this.scene);
    ambient.intensity = 0.55;
    ambient.diffuse = Color3.FromHexString("#7A8DA1");
    ambient.groundColor = Color3.FromHexString("#090C10");
    const moon = new DirectionalLight("moon", new Vector3(-0.35, -1, 0.3), this.scene);
    moon.position = new Vector3(14, 22, 10);
    moon.intensity = 0.6;
    moon.diffuse = Color3.FromHexString("#91A4B6");
    const road = MeshBuilder.CreateGround("road", { width: 14, height: 30, subdivisions: 1 }, this.scene);
    road.position.z = -2;
    road.material = makeAsphaltMaterial(this.scene);
    const curbMat = flatMaterial(this.scene, "curb-mat", "#58636B");
    for (const side of [-1, 1]) {
      const curb = MeshBuilder.CreateBox(`curb-${side}`, { width: 0.45, height: 0.3, depth: 30 }, this.scene);
      curb.position = new Vector3(side * 7.1, 0.16, -2);
      curb.material = curbMat;
      const sidewalk = MeshBuilder.CreateBox(`sidewalk-${side}`, { width: 3.4, height: 0.18, depth: 30 }, this.scene);
      sidewalk.position = new Vector3(side * 8.9, 0.08, -2);
      sidewalk.material = flatMaterial(this.scene, `sidewalk-${side}-mat`, "#343B41");
    }
    const buildingMat = makeConcreteMaterial(this.scene);
    const darkMat = flatMaterial(this.scene, "dark-metal", "#10151B");
    const windowMat = flatMaterial(this.scene, "window-glow", "#51605E", 0.6);
    [-10.3, 10.3].forEach((x, sideIndex) => {
      [-7, 3, 12].forEach((z, index) => {
        const building = MeshBuilder.CreateBox(`building-${sideIndex}-${index}`, { width: 4.3, height: 5.5 + (index % 2) * 1.2, depth: 5.8 }, this.scene);
        building.position = new Vector3(x, building.scaling.y, z);
        building.position.y = 2.75 + (index % 2) * 0.6;
        building.material = buildingMat;
        const shutter = MeshBuilder.CreateBox(`shutter-${sideIndex}-${index}`, { width: 2.1, height: 1.2, depth: 0.08 }, this.scene);
        shutter.position = new Vector3(x + (x > 0 ? -2.18 : 2.18), 1.55, z);
        shutter.material = index === 1 ? windowMat : darkMat;
      });
    });
    const laneMat = flatMaterial(this.scene, "lane-mat", "#D9D6C8", 0.1);
    for (let z = -13; z < 10; z += 3.2) {
      const mark = MeshBuilder.CreateBox(`lane-${z}`, { width: 0.14, height: 0.025, depth: 1.25 }, this.scene);
      mark.position = new Vector3(0, 0.035, z);
      mark.material = laneMat;
    }
    const crateMat = flatMaterial(this.scene, "crate-mat", "#5C4632");
    [[-5.6, 4.8], [5.5, -4.5], [-5.4, -8.4]].forEach(([x, z], index) => {
      const crate = MeshBuilder.CreateBox(`crate-${index}`, { size: 1.05 }, this.scene);
      crate.position = new Vector3(x, 0.55, z);
      crate.material = crateMat;
      crate.rotation.y = index * 0.45;
    });
    [-10, -2, 6].forEach((z, index) => {
      const pole = MeshBuilder.CreateCylinder(`lamp-pole-${index}`, { height: 4.3, diameter: 0.13, tessellation: 8 }, this.scene);
      pole.position = new Vector3(index % 2 === 0 ? -6.5 : 6.5, 2.15, z);
      pole.material = darkMat;
      const lamp = MeshBuilder.CreateBox(`lamp-${index}`, { width: 0.72, height: 0.25, depth: 0.55 }, this.scene);
      lamp.position = new Vector3(pole.position.x, 4.25, z);
      lamp.material = flatMaterial(this.scene, `lamp-mat-${index}`, "#EEC870", 0.9);
      const light = new PointLight(`pool-light-${index}`, new Vector3(pole.position.x, 3.9, z), this.scene);
      light.diffuse = Color3.FromHexString("#EEC870");
      light.intensity = 0.48;
      light.range = 7.5;
    });
    const barrierMat = flatMaterial(this.scene, "barrier-mat", "#EF6A2E", 0.18);
    [[-2.8, -2.2], [3.2, 7.1]].forEach(([x, z], index) => {
      const barrier = MeshBuilder.CreateBox(`barrier-${index}`, { width: 1.3, height: 0.75, depth: 0.35 }, this.scene);
      barrier.position = new Vector3(x, 0.38, z);
      barrier.rotation.y = 0.18 * (index ? -1 : 1);
      barrier.material = barrierMat;
    });
    const generated = generateDistrictProps(702942, 0, 0);
    generated.filter((prop) => prop.kind === "building").forEach((prop) => {
      const mass = MeshBuilder.CreateBox(prop.id, { width: 2.1, height: prop.scale, depth: 2.8 }, this.scene);
      mass.position = new Vector3(prop.x, prop.scale / 2, prop.z);
      mass.material = buildingMat;
    });
    generated.filter((prop) => prop.kind === "crate").forEach((prop) => {
      const crate = MeshBuilder.CreateBox(prop.id, { size: prop.scale }, this.scene);
      crate.position = new Vector3(prop.x, prop.scale / 2, prop.z);
      crate.material = prop.accent === "orange" ? barrierMat : crateMat;
      crate.rotation.y = prop.scale * .38;
    });
    generated.filter((prop) => prop.kind === "npc" || prop.kind === "quest").forEach((prop) => {
      const marker = MeshBuilder.CreateCylinder(prop.id, { height: 2.3, diameterTop: .08, diameterBottom: .5, tessellation: 4 }, this.scene);
      marker.position = new Vector3(prop.x, 1.2, prop.z);
      marker.material = flatMaterial(this.scene, `${prop.id}-mat`, prop.accent === "orange" ? "#EF6A2E" : "#C6F13D", .85);
      const halo = MeshBuilder.CreateTorus(`${prop.id}-halo`, { diameter: .65, thickness: .05, tessellation: 16 }, this.scene);
      halo.position = new Vector3(prop.x, .12, prop.z);
      halo.rotation.x = Math.PI / 2;
      halo.material = flatMaterial(this.scene, `${prop.id}-halo-mat`, prop.accent === "orange" ? "#EF6A2E" : "#C6F13D", .65);
    });
    this.loadOfficialStreetProp();
  }

  update(state: GameState) {
    this.player.update(state.player.x, state.player.z, state.player.hp > 0, state.tick);
    state.enemies.forEach((enemy) => this.enemies.get(enemy.id)?.update(enemy.x, enemy.z, enemy.alive, state.tick));
    const current = new Set(state.pickups.map((pickup) => pickup.id));
    this.pickups.forEach((node, id) => {
      if (!current.has(id)) {
        node.dispose();
        this.pickups.delete(id);
      }
    });
    state.pickups.forEach((pickup, index) => {
      let node = this.pickups.get(pickup.id);
      if (!node) {
        node = new TransformNode(pickup.id, this.scene);
        const shard = MeshBuilder.CreatePolyhedron(`${pickup.id}-shape`, { type: 1, size: 0.35 }, this.scene);
        shard.parent = node;
        shard.material = flatMaterial(this.scene, `${pickup.id}-mat`, pickup.kind === "weapon" ? "#EF6A2E" : "#C6F13D", .85);
        const halo = MeshBuilder.CreateTorus(`${pickup.id}-halo`, { diameter: 0.75, thickness: 0.035, tessellation: 20 }, this.scene);
        halo.parent = node;
        halo.rotation.x = Math.PI / 2;
        halo.position.y = 0.08;
        halo.material = flatMaterial(this.scene, `${pickup.id}-halo-mat`, pickup.kind === "weapon" ? "#EF6A2E" : "#C6F13D", .65);
        this.pickups.set(pickup.id, node);
      }
      node.position.x = fromFixed(pickup.x);
      node.position.z = fromFixed(pickup.z);
      node.position.y = 0.72 + Math.sin((state.tick + index * 9) * 0.15) * 0.12;
      node.rotation.y = state.tick * 0.09;
    });
  }

  getPlayerPosition() {
    return this.player.root.position;
  }

  dispose() {
    this.pickups.forEach((node) => node.dispose());
  }
}
