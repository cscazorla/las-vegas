import { Wallet } from '@/core/Wallet';

export class MoneyDisplay {
  private container: HTMLDivElement;
  private label: HTMLSpanElement;
  private cachedText = '';
  private onBalanceChanged: () => void;

  constructor(private wallet: Wallet) {
    this.container = document.createElement('div');
    this.container.style.cssText = [
      'position: fixed',
      'top: 8px',
      'right: 8px',
      'z-index: 900',
      'display: flex',
      'background: #1a1a2e',
      'border: 1px solid #333',
      'border-radius: 6px',
      'padding: 4px 12px',
      'box-shadow: 0 4px 12px rgba(0,0,0,0.4)',
      'font-family: sans-serif',
      'font-size: 14px',
      'align-items: center',
      'color: #e0e0e0',
    ].join(';');

    this.label = document.createElement('span');
    this.label.style.cssText = ['padding: 4px 8px', 'white-space: nowrap'].join(';');
    this.container.appendChild(this.label);

    this.updateText();

    this.onBalanceChanged = () => this.updateText();
    this.wallet.on('balanceChanged', this.onBalanceChanged);

    document.body.appendChild(this.container);
  }

  dispose(): void {
    this.wallet.off('balanceChanged', this.onBalanceChanged);
    this.container.remove();
  }

  private updateText(): void {
    const text = `$${this.wallet.balance.toLocaleString()}`;
    if (text !== this.cachedText) {
      this.cachedText = text;
      this.label.textContent = text;
    }
  }
}
