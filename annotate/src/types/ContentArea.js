import { nanoid } from 'nanoid';

/**
 * Represents a selectable content area within a PDF page
 */
export class ContentArea {
  constructor(props = {}) {
    // Make sure we're using nanoid for shorter, more readable IDs
    this.id = props.id || `area_${nanoid(6)}`; // Make ID readable with a prefix
    this.type = props.type || 'text'; // Default type
    this.x = props.x ?? 20; // Percentage from left of page
    this.y = props.y ?? 20; // Percentage from top of page
    this.width = props.width ?? 60; // Percentage of page width
    this.height = props.height ?? 10; // Percentage of page height
    this.index = props.index ?? 0; // Order in content flow
    this.name = props.name || `Area ${this.index + 1}`;
    this.deleted = props.deleted || false;
    this.meta = props.meta || {};
  }
  
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      index: this.index,
      name: this.name,
      deleted: this.deleted,
      meta: this.meta
    };
  }
  
  static fromJSON(json) {
    return new ContentArea(json);
  }
}
