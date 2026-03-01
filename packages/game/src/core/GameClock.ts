export enum GameSpeed {
  Paused = 0,
  Normal = 1,
  Fast = 2,
  Fastest = 3,
}

export interface GameTime {
  totalMinutes: number;
  minute: number;
  hour: number;
  day: number;
}

type GameClockEvent = 'hourChanged' | 'dayChanged' | 'speedChanged';
type GameClockListener = () => void;

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 1440; // 60 * 24
const GAME_MINUTES_PER_REAL_SECOND = 2;
const START_MINUTES = 480; // 08:00 on Day 1

export class GameClock {
  private _totalMinutes = START_MINUTES;
  private _speed: GameSpeed = GameSpeed.Normal;
  private _lastHour: number;
  private _lastDay: number;
  private listeners = new Map<GameClockEvent, Set<GameClockListener>>();

  constructor() {
    const t = this.time;
    this._lastHour = t.hour;
    this._lastDay = t.day;
  }

  get speed(): GameSpeed {
    return this._speed;
  }

  get time(): GameTime {
    const total = Math.floor(this._totalMinutes);
    const minuteOfDay = total % MINUTES_PER_DAY;
    return {
      totalMinutes: total,
      minute: minuteOfDay % MINUTES_PER_HOUR,
      hour: Math.floor(minuteOfDay / MINUTES_PER_HOUR),
      day: Math.floor(total / MINUTES_PER_DAY) + 1,
    };
  }

  update(realDelta: number): void {
    if (this._speed === GameSpeed.Paused) return;

    this._totalMinutes += realDelta * GAME_MINUTES_PER_REAL_SECOND * this._speed;

    const t = this.time;
    if (t.hour !== this._lastHour) {
      this._lastHour = t.hour;
      this.emit('hourChanged');
    }
    if (t.day !== this._lastDay) {
      this._lastDay = t.day;
      this.emit('dayChanged');
    }
  }

  setSpeed(speed: GameSpeed): void {
    if (this._speed === speed) return;
    this._speed = speed;
    this.emit('speedChanged');
  }

  on(event: GameClockEvent, listener: GameClockListener): void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener);
  }

  off(event: GameClockEvent, listener: GameClockListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  dispose(): void {
    this.listeners.clear();
  }

  private emit(event: GameClockEvent): void {
    this.listeners.get(event)?.forEach((fn) => fn());
  }
}
