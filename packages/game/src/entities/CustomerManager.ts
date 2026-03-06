import type { Customer, Entity, EntityManager, MenuContext } from '@/entities/types';
import type { ContextMenuItem } from '@/ui/ContextMenu';
import { createCustomerMesh, CUSTOMER_TEXTURE_PATHS } from '@/entities/createCustomerMesh';
import { World } from '@/core/World';
import { AssetLoader } from '@/rendering/AssetLoader';
import { GameClock } from '@/core/GameClock';
import { CustomerWalkSystem } from '@/entities/CustomerWalkSystem';

type CustomerEvent = 'countChanged';
type CustomerListener = () => void;

export class CustomerManager implements EntityManager {
  readonly entityType = 'customer';
  private listeners = new Map<CustomerEvent, Set<CustomerListener>>();
  private walkSystem: CustomerWalkSystem;

  constructor(
    private world: World,
    private loader: AssetLoader,
    gameClock: GameClock,
  ) {
    this.walkSystem = new CustomerWalkSystem(world, this, loader, gameClock);
  }

  spawn(col: number, row: number): Customer {
    const texturePath =
      CUSTOMER_TEXTURE_PATHS[Math.floor(Math.random() * CUSTOMER_TEXTURE_PATHS.length)];
    const texture = this.loader.getTexture(texturePath);
    const mesh = createCustomerMesh(this.loader, texture);
    const worldPos = this.world.grid.cellToWorld(col, row);
    mesh.position.copy(worldPos);

    const entity = this.world.addEntity(mesh, 'customer');
    const customer = { ...entity, type: 'customer' } as Customer;
    this.walkSystem.register(customer, col, row);
    this.emit('countChanged');
    return customer;
  }

  remove(id: number): boolean {
    this.walkSystem.unregister(id);
    const result = this.world.removeEntity(id);
    if (result) {
      this.emit('countChanged');
    }
    return result;
  }

  update(delta: number): void {
    this.walkSystem.update(delta);
  }

  getAll(): Customer[] {
    return this.world.getEntitiesByType<Customer>('customer');
  }

  get count(): number {
    return this.getAll().length;
  }

  getContextMenuItems(_entity: Entity, _context: MenuContext): ContextMenuItem[] {
    return [];
  }

  on(event: CustomerEvent, listener: CustomerListener): void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener);
  }

  off(event: CustomerEvent, listener: CustomerListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  dispose(): void {
    this.walkSystem.dispose();
    this.listeners.clear();
  }

  private emit(event: CustomerEvent): void {
    this.listeners.get(event)?.forEach((fn) => fn());
  }
}
