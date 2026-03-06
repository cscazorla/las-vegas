import { CustomerManager } from '@/entities/CustomerManager';
import { theme } from './theme';

export class CustomerCountDisplay {
  private container: HTMLDivElement;
  private label: HTMLSpanElement;
  private cachedText = '';
  private onCountChanged: () => void;

  constructor(private customers: CustomerManager) {
    this.container = document.createElement('div');
    this.container.style.cssText = [
      'position: fixed',
      'top: 8px',
      'right: 120px',
      'z-index: 900',
      'display: flex',
      `background: ${theme.bg}`,
      `border: 1px solid ${theme.border}`,
      'border-radius: 6px',
      'padding: 4px 12px',
      `box-shadow: 0 4px 12px ${theme.shadow}`,
      'font-family: sans-serif',
      'font-size: 14px',
      'align-items: center',
      `color: ${theme.text}`,
    ].join(';');

    this.label = document.createElement('span');
    this.label.style.cssText = ['padding: 4px 8px', 'white-space: nowrap'].join(';');
    this.container.appendChild(this.label);

    this.updateText();

    this.onCountChanged = () => this.updateText();
    this.customers.on('countChanged', this.onCountChanged);

    document.body.appendChild(this.container);
  }

  dispose(): void {
    this.customers.off('countChanged', this.onCountChanged);
    this.container.remove();
  }

  private updateText(): void {
    const text = `\u{1F464} ${this.customers.count}`;
    if (text !== this.cachedText) {
      this.cachedText = text;
      this.label.textContent = text;
    }
  }
}
