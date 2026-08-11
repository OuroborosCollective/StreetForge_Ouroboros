// StreetForge scene contract: Babylon owns rendering; fixed-step sim owns combat truth; React receives snapshots only.
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import type { Engine } from "@babylonjs/core/Engines/engine";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import type { Action } from "./input";
import { InputManager } from "./input";
import { createInitialState, makeSnapshot, reduce, TICK_MS, type GameState, type Intent } from "./sim";
import type { GameSnapshot } from "./types";
import { GameWorld } from "./world";

export type GameHandle = {
  scene: Scene;
  start: () => void;
  action: (action: Action) => void;
  move: (x: number, z: number) => void;
  dispose: () => void;
};

export interface SceneOptions {
  onSnapshot(snapshot: GameSnapshot): void;
  onArmoryToggle(): void;
}

const actionToIntent = (action: Action, axis: { x: number; z: number }): Intent | null => {
  if (action === "attack") return { type: "attack" };
  if (action === "dash") return { type: "dash", ...axis };
  if (action === "heavy") return { type: "heavy" };
  if (action === "collect") return { type: "collect" };
  return null;
};

export async function createGameScene(engine: Engine, canvas: HTMLCanvasElement, options: SceneOptions): Promise<GameHandle> {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.025, 0.04, 0.06, 1);
  const camera = new ArcRotateCamera("street-camera", Math.PI / 2, 1.06, 13.5, new Vector3(0, 1.1, 5), scene);
  camera.lowerRadiusLimit = 9;
  camera.upperRadiusLimit = 17;
  camera.lowerBetaLimit = 0.78;
  camera.upperBetaLimit = 1.25;
  camera.wheelPrecision = 45;
  camera.attachControl(canvas, true);
  const world = new GameWorld(scene);
  const input = new InputManager();
  let state: GameState = createInitialState();
  let accumulator = 0;
  let lastTime = performance.now();

  const publish = () => options.onSnapshot(makeSnapshot(state));
  const run = (intent: Intent) => {
    const result = reduce(state, intent);
    state = result.state;
  };
  const getCameraAxis = () => {
    const raw = input.getAxis();
    if (raw.x === 0 && raw.z === 0) return raw;
    const forward = camera.target.subtract(camera.position);
    forward.y = 0;
    forward.normalize();
    const right = Vector3.Cross(forward, Vector3.Up());
    const x = Math.round(right.x * raw.x + forward.x * -raw.z);
    const z = Math.round(right.z * raw.x + forward.z * -raw.z);
    return { x, z };
  };
  const autoAxis = () => {
    const target = state.enemies.filter((enemy) => enemy.alive)[0] ?? state.pickups[0];
    if (!target) return { x: 0, z: 0 };
    const dx = target.x - state.player.x;
    const dz = target.z - state.player.z;
    return { x: Math.abs(dx) > 85 ? Math.sign(dx) : 0, z: Math.abs(dz) > 85 ? Math.sign(dz) : 0 };
  };
  const autoActions = (axis: { x: number; z: number }) => {
    if (state.enemies.some((enemy) => enemy.alive)) {
      const nearest = state.enemies.filter((enemy) => enemy.alive).sort((a, b) => (a.x - state.player.x) ** 2 + (a.z - state.player.z) ** 2 - ((b.x - state.player.x) ** 2 + (b.z - state.player.z) ** 2))[0];
      const distance = Math.hypot(nearest.x - state.player.x, nearest.z - state.player.z);
      if (distance < 270 && state.tick % 14 === 0) run({ type: "attack" });
      if (distance < 310 && state.tick % 42 === 0) run({ type: "dash", ...axis });
      if (distance < 290 && state.tick % 38 === 0) run({ type: "heavy" });
    } else if (state.pickups.length && state.tick % 18 === 0) {
      run({ type: "collect" });
    }
  };

  publish();
  scene.onBeforeRenderObservable.add(() => {
    const now = performance.now();
    const delta = Math.min(100, now - lastTime);
    lastTime = now;
    accumulator += delta;
    while (accumulator >= TICK_MS) {
      if (state.active) {
        const axis = getCameraAxis();
        if (axis.x || axis.z) run({ type: "move", ...axis });
        input.drainActions().forEach((action) => {
          if (action === "toggleArmory") options.onArmoryToggle();
          else {
            const intent = actionToIntent(action, getCameraAxis());
            if (intent) run(intent);
          }
        });
        run({ type: "tick" });
      }
      accumulator -= TICK_MS;
    }
    const playerPosition = world.getPlayerPosition();
    camera.target = Vector3.Lerp(camera.target, new Vector3(playerPosition.x, 1.18, playerPosition.z - 1.2), 0.1);
    world.update(state);
    publish();
  });

  return {
    scene,
    start() {
      state.active = true;
      withFocus(canvas);
      publish();
    },
    action(action) {
      if (!state.active) return;
      if (action === "toggleArmory") options.onArmoryToggle();
      else {
        const intent = actionToIntent(action, getCameraAxis());
        if (intent) run(intent);
      }
      publish();
    },
    move(x, z) {
      if (!state.active) return;
      run({ type: "move", x: Math.max(-1, Math.min(1, Math.trunc(x))), z: Math.max(-1, Math.min(1, Math.trunc(z))) });
      publish();
    },
    dispose() {
      input.dispose();
      world.dispose();
      scene.dispose();
    },
  };
}

function withFocus(canvas: HTMLCanvasElement) {
  canvas.focus({ preventScroll: true });
}
