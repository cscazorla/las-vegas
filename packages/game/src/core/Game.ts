import * as THREE from 'three';
import { SceneManager } from '@/rendering/SceneManager';
import { World } from '@/core/World';
import { InteractionManager } from '@/core/InteractionManager';

export interface GameOptions {
  debug?: boolean;
}

export class Game {
  readonly debug: boolean;
  private clock: THREE.Clock;
  private sceneManager: SceneManager;
  private world: World;
  private interaction: InteractionManager;
  private animationFrameId: number | null = null;

  constructor({ debug = false }: GameOptions = {}) {
    this.debug = debug;
    this.clock = new THREE.Clock(false);
    this.sceneManager = new SceneManager({ debug: this.debug });
    this.world = new World(this.sceneManager.scene, this.debug);

    this.interaction = new InteractionManager(
      this.sceneManager.camera,
      this.sceneManager.renderer.domElement,
      this.world,
    );

    // Demo cabinets at cell (0, 0) → world (0.5, 0, 0.5)
    this.world.cabinets.add(0, 0);
    this.world.cabinets.add(-1, 0);
    this.world.cabinets.add(0, -1, new THREE.Euler(0, Math.PI, 0));
    this.world.cabinets.add(-1, -1, new THREE.Euler(0, -Math.PI, 0));
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
    this.interaction.update();
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
    this.interaction.dispose();
    this.world.dispose();
    this.sceneManager.dispose();
  }
}
