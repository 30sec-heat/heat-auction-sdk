// Event system main export
export { EventEmitter } from './emitter';
export { EventListener } from './listener';
export { BomboclatEventParser } from './parser';

import { EventEmitter } from './emitter';
import { EventListener } from './listener';
import { Connection } from '@solana/web3.js';
import { Program } from '@coral-xyz/anchor';
import { Bomboclat } from '../../idl/bomboclat';

export class EventSystem {
  private emitter: EventEmitter;
  private listener: EventListener;

  // Public methods
  public onAuctionEvent: typeof EventEmitter.prototype.onAuctionEvent;
  public onAllAuctionEvents: typeof EventEmitter.prototype.onAllAuctionEvents;
  public onAuctionEvents: typeof EventEmitter.prototype.onAuctionEvents;
  public onEventType: typeof EventEmitter.prototype.onEventType;
  public offAuctionEvent: typeof EventEmitter.prototype.offAuctionEvent;
  public removeAllEventListeners: typeof EventEmitter.prototype.removeAllEventListeners;

  constructor(program: Program<Bomboclat>, connection: Connection) {
    this.emitter = new EventEmitter();
    this.listener = new EventListener(program, connection, this.emitter);

    // Bind methods
    this.onAuctionEvent = this.emitter.onAuctionEvent.bind(this.emitter);
    this.onAllAuctionEvents = this.emitter.onAllAuctionEvents.bind(this.emitter);
    this.onAuctionEvents = this.emitter.onAuctionEvents.bind(this.emitter);
    this.onEventType = this.emitter.onEventType.bind(this.emitter);
    this.offAuctionEvent = this.emitter.offAuctionEvent.bind(this.emitter);
    this.removeAllEventListeners = this.emitter.removeAllEventListeners.bind(this.emitter);
  }

  /**
   * Start listening for events from the blockchain
   */
  async startEventListening(): Promise<void> {
    return this.listener.startEventListening();
  }

  /**
   * Stop listening for events
   */
  async stopEventListening(): Promise<void> {
    return this.listener.stopEventListening();
  }

  /**
   * Check if currently listening for events
   */
  get isListening(): boolean {
    return this.listener.isListening;
  }
}