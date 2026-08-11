// StreetForge input layer: DOM keyboard events are normalized into semantic actions and disposed with the scene.
export type Action = "attack" | "dash" | "heavy" | "collect" | "toggleArmory";

export class InputManager {
  private held = new Set<string>();
  private queue: Action[] = [];
  private readonly onKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (["w", "a", "s", "d", "arrowup", "arrowleft", "arrowdown", "arrowright", " ", "q", "1", "e", "i"].includes(key)) event.preventDefault();
    this.held.add(key);
    if (event.repeat) return;
    if (key === " ") this.queue.push("attack");
    if (key === "q") this.queue.push("dash");
    if (key === "1") this.queue.push("heavy");
    if (key === "e") this.queue.push("collect");
    if (key === "i") this.queue.push("toggleArmory");
  };
  private readonly onKeyUp = (event: KeyboardEvent) => this.held.delete(event.key.toLowerCase());

  constructor() {
    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp);
  }

  getAxis() {
    const x = (this.held.has("d") || this.held.has("arrowright") ? 1 : 0) - (this.held.has("a") || this.held.has("arrowleft") ? 1 : 0);
    const z = (this.held.has("s") || this.held.has("arrowdown") ? 1 : 0) - (this.held.has("w") || this.held.has("arrowup") ? 1 : 0);
    return { x, z };
  }

  drainActions() {
    const actions = [...this.queue];
    this.queue = [];
    return actions;
  }

  dispose() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }
}
