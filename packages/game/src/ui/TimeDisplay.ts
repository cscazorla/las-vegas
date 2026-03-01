import { GameClock, GameSpeed } from '@/core/GameClock';
import type { GameTime } from '@/core/GameClock';
import { theme } from './theme';

export interface TimeDisplayOptions {
  onSpeedChange: (speed: GameSpeed) => void;
}

export class TimeDisplay {
  private container: HTMLDivElement;
  private dayLabel: HTMLSpanElement;
  private timeLabel: HTMLSpanElement;
  private speedButtons: Map<GameSpeed, HTMLButtonElement> = new Map();
  private cachedDayText = '';
  private cachedTimeText = '';
  private onSpeedChanged: () => void;

  constructor(
    private gameClock: GameClock,
    private options: TimeDisplayOptions,
  ) {
    this.container = document.createElement('div');
    this.container.style.cssText = [
      'position: fixed',
      'top: 8px',
      'left: 50%',
      'transform: translateX(-50%)',
      'z-index: 900',
      'display: flex',
      `background: ${theme.bg}`,
      `border: 1px solid ${theme.border}`,
      'border-radius: 6px',
      'padding: 4px 8px',
      `box-shadow: 0 4px 12px ${theme.shadow}`,
      'font-family: sans-serif',
      'font-size: 14px',
      'gap: 4px',
      'align-items: center',
      `color: ${theme.text}`,
    ].join(';');

    this.dayLabel = this.createLabel('Day 1');
    this.container.appendChild(this.dayLabel);
    this.container.appendChild(this.createSeparator());

    this.timeLabel = this.createLabel('08:00');
    this.container.appendChild(this.timeLabel);
    this.container.appendChild(this.createSeparator());

    this.addSpeedButton(GameSpeed.Normal, '1x', 'Normal speed');
    this.addSpeedButton(GameSpeed.Fast, '2x', 'Fast speed');
    this.addSpeedButton(GameSpeed.Fastest, '3x', 'Fastest speed');
    this.addSpeedButton(GameSpeed.Paused, '⏸', 'Pause');

    this.highlightActiveSpeed(this.gameClock.speed);

    this.onSpeedChanged = () => {
      this.highlightActiveSpeed(this.gameClock.speed);
    };
    this.gameClock.on('speedChanged', this.onSpeedChanged);

    document.body.appendChild(this.container);
  }

  update(time: GameTime): void {
    const dayText = `Day ${time.day}`;
    if (dayText !== this.cachedDayText) {
      this.cachedDayText = dayText;
      this.dayLabel.textContent = dayText;
    }

    const timeText = `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;
    if (timeText !== this.cachedTimeText) {
      this.cachedTimeText = timeText;
      this.timeLabel.textContent = timeText;
    }
  }

  dispose(): void {
    this.gameClock.off('speedChanged', this.onSpeedChanged);
    this.container.remove();
  }

  private createLabel(text: string): HTMLSpanElement {
    const span = document.createElement('span');
    span.textContent = text;
    span.style.cssText = ['padding: 4px 8px', 'white-space: nowrap'].join(';');
    return span;
  }

  private addSpeedButton(speed: GameSpeed, label: string, title: string): void {
    const btn = this.createButton(label, () => this.options.onSpeedChange(speed), title);
    this.speedButtons.set(speed, btn);
    this.container.appendChild(btn);
  }

  private highlightActiveSpeed(active: GameSpeed): void {
    for (const [speed, btn] of this.speedButtons) {
      btn.style.background = speed === active ? theme.hover : 'transparent';
    }
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
      `color: ${theme.text}`,
      'cursor: pointer',
      'font-size: 14px',
      'line-height: 1',
    ].join(';');

    btn.addEventListener('mouseenter', () => {
      const isActive = [...this.speedButtons.entries()].some(
        ([speed, b]) => b === btn && speed === this.gameClock.speed,
      );
      if (!isActive) {
        btn.style.background = theme.hoverLight;
      }
    });
    btn.addEventListener('mouseleave', () => {
      const isActive = [...this.speedButtons.entries()].some(
        ([speed, b]) => b === btn && speed === this.gameClock.speed,
      );
      btn.style.background = isActive ? theme.hover : 'transparent';
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
      `background: ${theme.border}`,
      'margin: 0 4px',
    ].join(';');
    return sep;
  }
}
