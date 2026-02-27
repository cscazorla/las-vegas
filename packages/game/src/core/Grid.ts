import * as THREE from 'three';

export interface GridOptions {
  width: number;
  depth: number;
  cellSize: number;
}

export class Grid {
  readonly cellSize: number;
  readonly minCol: number;
  readonly maxCol: number;
  readonly minRow: number;
  readonly maxRow: number;

  constructor({ width, depth, cellSize }: GridOptions) {
    this.cellSize = cellSize;
    this.minCol = -Math.floor(width / cellSize / 2);
    this.maxCol = Math.floor(width / cellSize / 2) - 1;
    this.minRow = -Math.floor(depth / cellSize / 2);
    this.maxRow = Math.floor(depth / cellSize / 2) - 1;
  }

  cellToWorld(col: number, row: number): THREE.Vector3 {
    const x = col * this.cellSize + this.cellSize / 2;
    const z = row * this.cellSize + this.cellSize / 2;
    return new THREE.Vector3(x, 0, z);
  }

  worldToCell(worldX: number, worldZ: number): { col: number; row: number } {
    return {
      col: Math.floor(worldX / this.cellSize),
      row: Math.floor(worldZ / this.cellSize),
    };
  }

  contains(col: number, row: number): boolean {
    return col >= this.minCol && col <= this.maxCol && row >= this.minRow && row <= this.maxRow;
  }

  createHelper(): THREE.GridHelper {
    const size = (this.maxCol - this.minCol + 1) * this.cellSize;
    const divisions = size / this.cellSize;
    const helper = new THREE.GridHelper(size, divisions, 0xffffff, 0xcccccc);
    helper.position.y = 0.005;
    return helper;
  }
}
