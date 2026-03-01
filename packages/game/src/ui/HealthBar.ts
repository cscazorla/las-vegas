import { theme } from './theme';

export class HealthBar {
  private container: HTMLDivElement;
  private bar: HTMLDivElement;
  private label: HTMLSpanElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.style.cssText = [
      'position: fixed',
      'z-index: 999',
      'display: none',
      'pointer-events: none',
      'width: 120px',
      'transform: translateX(-50%)',
    ].join(';');

    // Background track
    const track = document.createElement('div');
    track.style.cssText = [
      'width: 100%',
      'height: 6px',
      'border-radius: 3px',
      `background: ${theme.border}`,
      `border: 1px solid ${theme.border}`,
      'overflow: hidden',
    ].join(';');

    this.bar = document.createElement('div');
    this.bar.style.cssText = [
      'height: 100%',
      'border-radius: 3px',
      'transition: width 0.3s, background 0.3s',
    ].join(';');
    track.appendChild(this.bar);

    this.label = document.createElement('span');
    this.label.style.cssText = [
      'display: block',
      'text-align: center',
      'font-family: sans-serif',
      'font-size: 11px',
      `color: ${theme.text}`,
      'margin-top: 2px',
    ].join(';');

    this.container.appendChild(track);
    this.container.appendChild(this.label);
    document.body.appendChild(this.container);
  }

  show(condition: number): void {
    const clamped = Math.max(0, Math.min(100, condition));
    this.bar.style.width = `${clamped}%`;
    this.bar.style.background = conditionColor(clamped);
    this.label.textContent = `${Math.round(clamped)}%`;
    this.container.style.display = 'block';
  }

  hide(): void {
    this.container.style.display = 'none';
  }

  get visible(): boolean {
    return this.container.style.display !== 'none';
  }

  updatePosition(screenPos: { x: number; y: number }): void {
    if (!this.visible) return;
    this.container.style.left = `${screenPos.x}px`;
    this.container.style.top = `${screenPos.y}px`;
  }

  dispose(): void {
    this.container.remove();
  }
}

function conditionColor(condition: number): string {
  if (condition > 60) return '#4caf50';
  if (condition > 30) return '#ff9800';
  return '#f44336';
}
