"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConnection = createConnection;
const web3_js_1 = require("@solana/web3.js");
/**
 * Create a Solana connection from environment variables
 */
function createConnection() {
    const rpcUrl = process.env.SOLANA_RPC_URL;
    const commitment = process.env.SOLANA_COMMITMENT || 'confirmed';
    return new web3_js_1.Connection(rpcUrl, commitment);
}
