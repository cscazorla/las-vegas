import * as THREE from 'three';
import { SceneManager } from '@/rendering/SceneManager';
import { AssetLoader } from '@/rendering/AssetLoader';
import { World } from '@/core/World';
import { InteractionManager } from '@/core/InteractionManager';
import { GameClock } from '@/core/GameClock';
import { Wallet } from '@/core/Wallet';
import { SideMenu } from '@/ui/SideMenu';
import { TimeDisplay } from '@/ui/TimeDisplay';
import { MoneyDisplay } from '@/ui/MoneyDisplay';
import { CustomerCountDisplay } from '@/ui/CustomerCountDisplay';
import { CabinetPanel } from '@/ui/CabinetPanel';
import { CABINET_CATALOG, CABINET_MODEL_PATHS } from '@/data/cabinetCatalog';
import { CUSTOMER_MODEL_PATH, CUSTOMER_TEXTURE_PATHS } from '@/entities/createCustomerMesh';

export interface GameOptions {
  debug?: boolean;
}

export class Game {
  readonly debug: boolean;
  private clock: THREE.Clock;
  private sceneManager: SceneManager;
  private loader: AssetLoader;
  private wallet!: Wallet;
  private world!: World;
  private interaction!: InteractionManager;
  private gameClock!: GameClock;
  private timeDisplay!: TimeDisplay;
  private moneyDisplay!: MoneyDisplay;
  private customerCountDisplay!: CustomerCountDisplay;
  private sideMenu!: SideMenu;
  private animationFrameId: number | null = null;

  constructor({ debug = false }: GameOptions = {}) {
    this.debug = debug;
    this.clock = new THREE.Clock(false);
    this.sceneManager = new SceneManager({ debug: this.debug });
    this.loader = new AssetLoader();
  }

  async load(): Promise<void> {
    await this.loader.preload([...CABINET_MODEL_PATHS, CUSTOMER_MODEL_PATH]);
    await this.loader.preloadTextures(CUSTOMER_TEXTURE_PATHS);

    this.wallet = new Wallet();
    this.gameClock = new GameClock();
    this.world = new World(
      this.sceneManager.scene,
      this.loader,
      this.wallet,
      this.gameClock,
      this.debug,
    );

    this.interaction = new InteractionManager(
      this.sceneManager.camera,
      this.sceneManager.renderer.domElement,
      this.world,
    );
    this.timeDisplay = new TimeDisplay(this.gameClock, {
      onSpeedChange: (speed) => this.gameClock.setSpeed(speed),
    });
    this.moneyDisplay = new MoneyDisplay(this.wallet);
    this.customerCountDisplay = new CustomerCountDisplay(this.world.customers);

    const cabinetPanel = new CabinetPanel(CABINET_CATALOG, {
      onSelect: (catalogId) => this.world.cabinets.startPlacement(catalogId),
    });

    this.sideMenu = new SideMenu([{ label: 'C', tooltip: 'New Cabinet', panel: cabinetPanel }]);

    // Demo cabinets at cell (0, 0) → world (0.5, 0, 0.5)
    this.world.cabinets.add('street-fighter-ii', 0, 0);
    this.world.cabinets.add('pac-man', -1, 0);
    this.world.cabinets.add('space-invaders', 0, -1, new THREE.Euler(0, Math.PI, 0));
    this.world.cabinets.add('donkey-kong', -1, -1, new THREE.Euler(0, -Math.PI, 0));

    // Demo customers for visual verification
    this.world.customers.spawn(2, 0);
    this.world.customers.spawn(3, -3);
    this.world.customers.spawn(-2, 2);
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

  private update(delta: number): void {
    this.gameClock.update(delta);
    this.timeDisplay.update(this.gameClock.time);
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
    this.customerCountDisplay.dispose();
    this.moneyDisplay.dispose();
    this.timeDisplay.dispose();
    this.gameClock.dispose();
    this.wallet.dispose();
    this.sideMenu.dispose();
    this.interaction.dispose();
    this.world.dispose();
    this.sceneManager.dispose();
  }
}
