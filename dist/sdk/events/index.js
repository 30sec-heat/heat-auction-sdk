"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventSystem = exports.BomboclatEventParser = exports.EventListener = exports.EventEmitter = void 0;
// Event system main export
var emitter_1 = require("./emitter");
Object.defineProperty(exports, "EventEmitter", { enumerable: true, get: function () { return emitter_1.EventEmitter; } });
var listener_1 = require("./listener");
Object.defineProperty(exports, "EventListener", { enumerable: true, get: function () { return listener_1.EventListener; } });
var parser_1 = require("./parser");
Object.defineProperty(exports, "BomboclatEventParser", { enumerable: true, get: function () { return parser_1.BomboclatEventParser; } });
const emitter_2 = require("./emitter");
const listener_2 = require("./listener");
class EventSystem {
    constructor(program, connection) {
        this.emitter = new emitter_2.EventEmitter();
        this.listener = new listener_2.EventListener(program, connection, this.emitter);
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
    async startEventListening() {
        return this.listener.startEventListening();
    }
    /**
     * Stop listening for events
     */
    async stopEventListening() {
        return this.listener.stopEventListening();
    }
    /**
     * Check if currently listening for events
     */
    get isListening() {
        return this.listener.isListening;
    }
}
exports.EventSystem = EventSystem;
