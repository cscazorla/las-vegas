export interface SidePanel {
  show(): void;
  hide(): void;
  get visible(): boolean;
  dispose(): void;
}

export interface SideMenuButton {
  label: string;
  tooltip: string;
  panel: SidePanel;
}

export class SideMenu {
  private container: HTMLDivElement;
  private panels: SidePanel[];

  constructor(buttons: SideMenuButton[]) {
    this.panels = buttons.map((b) => b.panel);

    this.container = document.createElement('div');
    this.container.style.cssText = [
      'position: fixed',
      'left: 0',
      'top: 0',
      'height: 100%',
      'width: 48px',
      'background: #1a1a2e',
      'border-right: 1px solid #333',
      'display: flex',
      'flex-direction: column',
      'align-items: center',
      'padding-top: 8px',
      'gap: 8px',
      'z-index: 900',
      'font-family: sans-serif',
    ].join(';');

    for (const button of buttons) {
      this.container.appendChild(this.createButton(button));
    }

    document.body.appendChild(this.container);
  }

  dispose(): void {
    for (const panel of this.panels) {
      panel.dispose();
    }
    this.container.remove();
  }

  private togglePanel(panel: SidePanel): void {
    if (panel.visible) {
      panel.hide();
      return;
    }
    for (const p of this.panels) {
      p.hide();
    }
    panel.show();
  }

  private createButton(button: SideMenuButton): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = button.label;
    btn.title = button.tooltip;
    btn.style.cssText = [
      'width: 40px',
      'height: 40px',
      'border: none',
      'border-radius: 6px',
      'background: transparent',
      'color: #e0e0e0',
      'font-size: 20px',
      'cursor: pointer',
      'display: flex',
      'align-items: center',
      'justify-content: center',
    ].join(';');

    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#2a2a4e';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'transparent';
    });
    btn.addEventListener('click', () => this.togglePanel(button.panel));

    return btn;
  }
}
