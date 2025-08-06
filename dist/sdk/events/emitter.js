"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventEmitter = void 0;
const web3_js_1 = require("@solana/web3.js");
class EventEmitter {
    constructor() {
        this.eventListeners = new Map();
    }
    /**
     * Subscribe to real-time auction events
     * @param filter - Optional filter for specific auction or event type
     * @param callback - Function to call when events are received
     * @returns Subscription ID for unsubscribing
     */
    onAuctionEvent(filter, callback) {
        const subscriptionId = Math.random().toString(36).substring(2, 15);
        const key = this.getEventKey(filter);
        if (!this.eventListeners.has(key)) {
            this.eventListeners.set(key, new Set());
        }
        this.eventListeners.get(key).add(callback);
        return subscriptionId;
    }
    /**
     * Subscribe to all auction events (no filter)
     */
    onAllAuctionEvents(callback) {
        return this.onAuctionEvent({}, callback);
    }
    /**
     * Subscribe to events for a specific auction
     */
    onAuctionEvents(auctionData, callback) {
        return this.onAuctionEvent({ auctionData }, callback);
    }
    /**
     * Subscribe to specific event types
     */
    onEventType(eventType, callback) {
        return this.onAuctionEvent({ eventType }, callback);
    }
    /**
     * Unsubscribe from events using subscription ID
     */
    offAuctionEvent(subscriptionId) {
        // Implementation would track subscription IDs
        // For now, this is a placeholder
        console.log(`Unsubscribed from events: ${subscriptionId}`);
    }
    /**
     * Remove all event listeners
     */
    removeAllEventListeners() {
        this.eventListeners.clear();
    }
    /**
     * Notify all relevant event listeners
     */
    notifyEventListeners(event) {
        // Notify listeners for all events
        const allEventsKey = this.getEventKey({});
        if (this.eventListeners.has(allEventsKey)) {
            this.eventListeners.get(allEventsKey).forEach(callback => {
                try {
                    callback(event);
                }
                catch (error) {
                    console.error('❌ Error in event callback:', error);
                }
            });
        }
        // Notify listeners for specific auction
        const auctionKey = this.getEventKey({ auctionData: new web3_js_1.PublicKey(event.auction) });
        if (this.eventListeners.has(auctionKey)) {
            this.eventListeners.get(auctionKey).forEach(callback => {
                try {
                    callback(event);
                }
                catch (error) {
                    console.error('❌ Error in event callback:', error);
                }
            });
        }
        // Notify listeners for specific event type
        const eventTypeKey = this.getEventKey({ eventType: event.type });
        if (this.eventListeners.has(eventTypeKey)) {
            this.eventListeners.get(eventTypeKey).forEach(callback => {
                try {
                    callback(event);
                }
                catch (error) {
                    console.error('❌ Error in event callback:', error);
                }
            });
        }
    }
    /**
     * Generate key for event listener map
     */
    getEventKey(filter) {
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
exports.EventEmitter = EventEmitter;
