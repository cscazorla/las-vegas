export interface RotationToolbarCallbacks {
  onRotateCCW: () => void;
  onRotateCW: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export class RotationToolbar {
  private container: HTMLDivElement;

  constructor(private callbacks: RotationToolbarCallbacks) {
    this.container = document.createElement('div');
    this.container.style.cssText = [
      'position: fixed',
      'z-index: 1000',
      'display: none',
      'bottom: 24px',
      'left: 50%',
      'transform: translateX(-50%)',
      'background: #1a1a2e',
      'border: 1px solid #333',
      'border-radius: 6px',
      'padding: 4px 8px',
      'box-shadow: 0 4px 12px rgba(0,0,0,0.4)',
      'font-family: sans-serif',
      'font-size: 18px',
      'gap: 4px',
      'align-items: center',
    ].join(';');

    this.container.appendChild(this.createButton('↶', callbacks.onRotateCCW, 'Rotate counter-clockwise'));
    this.container.appendChild(this.createButton('↷', callbacks.onRotateCW, 'Rotate clockwise'));
    this.container.appendChild(this.createSeparator());
    this.container.appendChild(this.createButton('✓', callbacks.onConfirm, 'Confirm'));
    this.container.appendChild(this.createButton('✗', callbacks.onCancel, 'Cancel'));

    document.body.appendChild(this.container);
  }

  show(): void {
    this.container.style.display = 'flex';
  }

  hide(): void {
    this.container.style.display = 'none';
  }

  dispose(): void {
    this.container.remove();
  }

  private createButton(label: string, onClick: () => void, title: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.title = title;
    btn.style.cssText = [
      'padding: 6px 12px',
      'border: none',
      'border-radius: 4px',
      'background: transparent',
      'color: #e0e0e0',
      'cursor: pointer',
      'font-size: 18px',
      'line-height: 1',
    ].join(';');

    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#2a2a4e';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'transparent';
    });
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick();
    });

    return btn;
  }

  private createSeparator(): HTMLSpanElement {
    const sep = document.createElement('span');
    sep.style.cssText = [
      'width: 1px',
      'height: 24px',
      'background: #333',
      'margin: 0 4px',
    ].join(';');
    return sep;
  }
}
