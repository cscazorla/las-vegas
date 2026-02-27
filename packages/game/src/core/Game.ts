import * as THREE from 'three';
import { SceneManager } from '@/rendering/SceneManager';

export interface GameOptions {
  debug?: boolean;
}

export class Game {
  readonly debug: boolean;
  private clock: THREE.Clock;
  private sceneManager: SceneManager;
  private animationFrameId: number | null = null;

  constructor({ debug = false }: GameOptions = {}) {
    this.debug = debug;
    this.clock = new THREE.Clock(false);
    this.sceneManager = new SceneManager({ debug: this.debug });
  }

  start(): void {
    window.addEventListener('resize', this.onResize);
    this.clock.start();
    this.loop();
  }

  private loop = (): void => {
    this.animationFrameId = requestAnimationFrame(this.loop);
    const delta = Math.min(this.clock.getDelta(), 0.1);
    this.update(delta);
    this.sceneManager.render();
  };

  private update(_delta: number): void {
    // Future: update entities, systems, etc.
  }

  private onResize = (): void => {
    this.sceneManager.handleResize();
  };

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    window.removeEventListener('resize', this.onResize);
    this.clock.stop();
  }

  dispose(): void {
    this.stop();
    this.sceneManager.dispose();
  }
}
