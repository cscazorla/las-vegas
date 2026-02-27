export interface ContextMenuItem {
  label: string;
  action?: () => void;
  disabled?: boolean;
}

export class ContextMenu {
  private container: HTMLDivElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.style.cssText = [
      'position: fixed',
      'z-index: 1000',
      'display: none',
      'background: #1a1a2e',
      'border: 1px solid #333',
      'border-radius: 6px',
      'padding: 4px',
      'min-width: 100px',
      'box-shadow: 0 4px 12px rgba(0,0,0,0.4)',
      'font-family: sans-serif',
      'font-size: 13px',
    ].join(';');

    document.body.appendChild(this.container);
  }

  show(screenPosition: { x: number; y: number }, items: ContextMenuItem[]): void {
    this.container.replaceChildren();

    for (const item of items) {
      const btn = this.createButton(item);
      this.container.appendChild(btn);
    }

    this.container.style.left = `${screenPosition.x}px`;
    this.container.style.top = `${screenPosition.y}px`;
    this.container.style.display = 'block';
  }

  hide(): void {
    this.container.style.display = 'none';
  }

  get visible(): boolean {
    return this.container.style.display !== 'none';
  }

  updatePosition(screenPosition: { x: number; y: number }): void {
    if (!this.visible) return;
    this.container.style.left = `${screenPosition.x}px`;
    this.container.style.top = `${screenPosition.y}px`;
  }

  dispose(): void {
    this.container.remove();
  }

  private createButton(item: ContextMenuItem): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = item.label;
    btn.disabled = !!item.disabled;
    btn.style.cssText = [
      'display: block',
      'width: 100%',
      'padding: 6px 12px',
      'border: none',
      'border-radius: 4px',
      'background: transparent',
      'color: #e0e0e0',
      'text-align: left',
      'cursor: pointer',
      'font-size: 13px',
    ].join(';');

    if (item.disabled) {
      btn.style.opacity = '0.4';
      btn.style.cursor = 'default';
    } else {
      btn.addEventListener('mouseenter', () => {
        btn.style.background = '#2a2a4e';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'transparent';
      });
      if (item.action) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          item.action!();
          this.hide();
        });
      }
    }

    return btn;
  }
}
