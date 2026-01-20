export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlacedElement {
  id: string;
  bbox: BoundingBox;
  priority: number; // Lower = higher priority (will stay in place)
}

export class CollisionManager {
  private placedElements: PlacedElement[] = [];

  clear(): void {
    this.placedElements = [];
  }

  addElement(id: string, bbox: BoundingBox, priority: number): void {
    this.placedElements.push({ id, bbox, priority });
  }

  checkCollision(bbox: BoundingBox, margin: number = 2): boolean {
    const expanded = {
      x: bbox.x - margin,
      y: bbox.y - margin,
      width: bbox.width + margin * 2,
      height: bbox.height + margin * 2,
    };

    return this.placedElements.some((el) =>
      this.boxesIntersect(expanded, el.bbox)
    );
  }

  private boxesIntersect(a: BoundingBox, b: BoundingBox): boolean {
    return !(
      a.x + a.width < b.x ||
      b.x + b.width < a.x ||
      a.y + a.height < b.y ||
      b.y + b.height < a.y
    );
  }

  findNonCollidingPosition(
    originalX: number,
    originalY: number,
    width: number,
    height: number,
    _anchorX: number, // kept for potential future heuristic use
    _anchorY: number,
    maxOffset: number = 80
  ): { x: number; y: number; needsLeader: boolean } {
    // Try original position first
    const originalBbox: BoundingBox = {
      x: originalX - width / 2,
      y: originalY - height / 2,
      width,
      height,
    };

    if (!this.checkCollision(originalBbox, 4)) {
      return { x: originalX, y: originalY, needsLeader: false };
    }

    // Try positions in expanding circles
    const angles = [0, 45, 90, 135, 180, 225, 270, 315];
    const distances = [20, 35, 50, 65, maxOffset];

    for (const dist of distances) {
      for (const angle of angles) {
        const rad = (angle * Math.PI) / 180;
        const testX = originalX + Math.cos(rad) * dist;
        const testY = originalY + Math.sin(rad) * dist;

        const testBbox: BoundingBox = {
          x: testX - width / 2,
          y: testY - height / 2,
          width,
          height,
        };

        if (!this.checkCollision(testBbox, 4)) {
          return { x: testX, y: testY, needsLeader: dist > 25 };
        }
      }
    }

    // If no good position found, use the least crowded direction
    // Default to above-right with max offset
    return {
      x: originalX + maxOffset * 0.7,
      y: originalY - maxOffset * 0.7,
      needsLeader: true,
    };
  }
}
