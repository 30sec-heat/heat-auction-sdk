"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventListener = void 0;
const parser_1 = require("./parser");
class EventListener {
    constructor(program, connection, emitter) {
        this._isListening = false; // Rename private variable
        this.subscriptionId = null;
        this.processedSignatures = new Set();
        this.program = program;
        this.connection = connection;
        this.emitter = emitter;
        this.parser = new parser_1.BomboclatEventParser(program);
    }
    /**
     * Get listening status
     */
    get isListening() {
        return this._isListening;
    }
    /**
     * Start listening to program events
     */
    async startEventListening() {
        if (this._isListening)
            return;
        try {
            this._isListening = true;
            console.log('🔊 Starting event listening...');
            // Try WebSocket first
            try {
                await this.startWebSocketListening();
            }
            catch (error) {
                console.warn('⚠️  WebSocket not available, falling back to polling');
                await this.startPolling();
            }
        }
        catch (error) {
            console.error('❌ Failed to start event listening:', error);
            this._isListening = false;
            throw error;
        }
    }
    /**
     * Stop listening to events
     */
    async stopEventListening() {
        this._isListening = false;
        if (this.subscriptionId !== null) {
            await this.connection.removeOnLogsListener(this.subscriptionId);
            this.subscriptionId = null;
        }
        console.log('🔇 Stopped event listening');
    }
    /**
     * Start WebSocket listening (preferred method)
     */
    async startWebSocketListening() {
        this.subscriptionId = this.connection.onLogs(this.program.programId, (logs, context) => {
            if (logs.err)
                return;
            try {
                const events = this.parser.parseEventsFromLogs(logs.logs);
                for (const event of events) {
                    console.log(`📢 Event received: ${event.type}`, event);
                    this.emitter.notifyEventListeners(event);
                }
            }
            catch (error) {
                console.error('❌ Error processing logs:', error);
            }
        }, 'confirmed');
        console.log('✅ WebSocket event listening started');
    }
    /**
     * Poll for new events (fallback method)
     */
    async startPolling() {
        const poll = async () => {
            if (!this.isListening)
                return;
            try {
                // Get recent signatures for our program
                const signatures = await this.connection.getSignaturesForAddress(this.program.programId, { limit: 20 }, 'confirmed');
                // Process new signatures
                for (const sigInfo of signatures.reverse()) {
                    if (this.processedSignatures.has(sigInfo.signature))
                        continue;
                    try {
                        const tx = await this.connection.getTransaction(sigInfo.signature, {
                            maxSupportedTransactionVersion: 0,
                            commitment: 'confirmed',
                        });
                        if (tx?.meta?.logMessages) {
                            const events = this.parser.parseEventsFromLogs(tx.meta.logMessages);
                            for (const event of events) {
                                console.log(`📢 Event found: ${event.type}`, event);
                                this.emitter.notifyEventListeners(event);
                            }
                            this.processedSignatures.add(sigInfo.signature);
                            // Keep set size manageable
                            if (this.processedSignatures.size > 1000) {
                                const toDelete = Array.from(this.processedSignatures).slice(0, 500);
                                toDelete.forEach(sig => this.processedSignatures.delete(sig));
                            }
                        }
                    }
                    catch (error) {
                        console.error(`❌ Error processing tx ${sigInfo.signature}:`, error);
                    }
                }
            }
            catch (error) {
                console.error('❌ Error polling for events:', error);
            }
            // Poll every 2 seconds
            if (this.isListening) {
                setTimeout(poll, 2000);
            }
        };
        console.log('✅ Polling event listening started');
        poll();
    }
}
exports.EventListener = EventListener;
