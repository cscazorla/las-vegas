import type { CabinetDefinition } from '@/data/cabinetCatalog';

export interface CabinetPanelCallbacks {
  onSelect: (catalogId: string) => void;
}

export class CabinetPanel {
  private container: HTMLDivElement;
  private isVisible = false;

  constructor(catalog: readonly CabinetDefinition[], callbacks: CabinetPanelCallbacks) {
    this.container = document.createElement('div');
    this.container.style.cssText = [
      'position: fixed',
      'left: 56px',
      'top: 0',
      'height: 100%',
      'width: 220px',
      'background: #1a1a2e',
      'border-right: 1px solid #333',
      'display: none',
      'flex-direction: column',
      'z-index: 900',
      'font-family: sans-serif',
      'overflow-y: auto',
    ].join(';');

    // Header
    const header = document.createElement('div');
    header.textContent = 'Cabinets';
    header.style.cssText = [
      'padding: 12px',
      'color: #e0e0e0',
      'font-size: 14px',
      'font-weight: bold',
      'border-bottom: 1px solid #333',
    ].join(';');
    this.container.appendChild(header);

    // Cabinet cards
    for (const def of catalog) {
      this.container.appendChild(this.createCard(def, callbacks));
    }

    document.body.appendChild(this.container);
  }

  show(): void {
    this.container.style.display = 'flex';
    this.isVisible = true;
  }

  hide(): void {
    this.container.style.display = 'none';
    this.isVisible = false;
  }

  get visible(): boolean {
    return this.isVisible;
  }

  dispose(): void {
    this.container.remove();
  }

  private createCard(def: CabinetDefinition, callbacks: CabinetPanelCallbacks): HTMLDivElement {
    const card = document.createElement('div');
    card.style.cssText = [
      'display: flex',
      'align-items: center',
      'gap: 10px',
      'padding: 10px 12px',
      'cursor: pointer',
      'color: #e0e0e0',
      'font-size: 13px',
    ].join(';');

    card.addEventListener('mouseenter', () => {
      card.style.background = '#2a2a4e';
    });
    card.addEventListener('mouseleave', () => {
      card.style.background = 'transparent';
    });
    card.addEventListener('click', () => {
      callbacks.onSelect(def.id);
      this.hide();
    });

    // Name + cost
    const text = document.createElement('div');
    const name = document.createElement('div');
    name.textContent = def.game;
    const cost = document.createElement('div');
    cost.textContent = `$${def.cost}`;
    cost.style.cssText = 'font-size: 11px; color: #888;';
    text.appendChild(name);
    text.appendChild(cost);
    card.appendChild(text);

    return card;
  }
}
