import { PublicKey } from '@solana/web3.js';
import { AllAuctionEvents, EventCallback, EventFilter } from '../types';

export class EventEmitter {
  private eventListeners = new Map<string, Set<EventCallback>>();

  /**
   * Subscribe to real-time auction events
   * @param filter - Optional filter for specific auction or event type
   * @param callback - Function to call when events are received
   * @returns Subscription ID for unsubscribing
   */
  onAuctionEvent(filter: EventFilter, callback: EventCallback): string {
    const subscriptionId = Math.random().toString(36).substring(2, 15);
    const key = this.getEventKey(filter);
    
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, new Set());
    }
    
    this.eventListeners.get(key)!.add(callback);
    
    return subscriptionId;
  }

  /**
   * Subscribe to all auction events (no filter)
   */
  onAllAuctionEvents(callback: EventCallback): string {
    return this.onAuctionEvent({}, callback);
  }

  /**
   * Subscribe to events for a specific auction
   */
  onAuctionEvents(auctionData: PublicKey, callback: EventCallback): string {
    return this.onAuctionEvent({ auctionData }, callback);
  }

  /**
   * Subscribe to specific event types
   */
  onEventType<T extends AllAuctionEvents>(eventType: T['type'], callback: (event: T) => void): string {
    return this.onAuctionEvent({ eventType }, callback as EventCallback);
  }

  /**
   * Unsubscribe from events using subscription ID
   */
  offAuctionEvent(subscriptionId: string): void {
    // Implementation would track subscription IDs
    // For now, this is a placeholder
    console.log(`Unsubscribed from events: ${subscriptionId}`);
  }

  /**
   * Remove all event listeners
   */
  removeAllEventListeners(): void {
    this.eventListeners.clear();
  }

  /**
   * Notify all relevant event listeners
   */
  notifyEventListeners(event: AllAuctionEvents): void {
    // Notify listeners for all events
    const allEventsKey = this.getEventKey({});
    if (this.eventListeners.has(allEventsKey)) {
      this.eventListeners.get(allEventsKey)!.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('❌ Error in event callback:', error);
        }
      });
    }
    
    // Notify listeners for specific auction
    const auctionKey = this.getEventKey({ auctionData: new PublicKey(event.auction) });
    if (this.eventListeners.has(auctionKey)) {
      this.eventListeners.get(auctionKey)!.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('❌ Error in event callback:', error);
        }
      });
    }
    
    // Notify listeners for specific event type
    const eventTypeKey = this.getEventKey({ eventType: event.type });
    if (this.eventListeners.has(eventTypeKey)) {
      this.eventListeners.get(eventTypeKey)!.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('❌ Error in event callback:', error);
        }
      });
    }
  }

  /**
   * Generate key for event listener map
   */
  private getEventKey(filter: EventFilter): string {
    const parts = [];
    if (filter.auctionData) {
      parts.push(`auction:${filter.auctionData.toBase58()}`);
    }
    if (filter.eventType) {
      parts.push(`type:${filter.eventType}`);
    }
    return parts.length > 0 ? parts.join('|') : 'all';
  }
} 