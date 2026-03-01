type WalletEvent = 'balanceChanged';
type WalletListener = () => void;

export const INITIAL_BALANCE = 5000;

export class Wallet {
  private _balance: number;
  private listeners = new Map<WalletEvent, Set<WalletListener>>();

  constructor(initial = INITIAL_BALANCE) {
    this._balance = initial;
  }

  get balance(): number {
    return this._balance;
  }

  canAfford(amount: number): boolean {
    return this._balance >= amount;
  }

  deduct(amount: number): boolean {
    if (!this.canAfford(amount)) return false;
    this._balance -= amount;
    this.emit('balanceChanged');
    return true;
  }

  on(event: WalletEvent, listener: WalletListener): void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener);
  }

  off(event: WalletEvent, listener: WalletListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  dispose(): void {
    this.listeners.clear();
  }

  private emit(event: WalletEvent): void {
    this.listeners.get(event)?.forEach((fn) => fn());
  }
}
