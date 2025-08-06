"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Wallet = exports.LAMPORTS_PER_SOL = exports.Keypair = exports.PublicKey = exports.Connection = void 0;
// Main SDK exports
__exportStar(require("./sdk"), exports);
// Re-export commonly used types
var web3_js_1 = require("@solana/web3.js");
Object.defineProperty(exports, "Connection", { enumerable: true, get: function () { return web3_js_1.Connection; } });
Object.defineProperty(exports, "PublicKey", { enumerable: true, get: function () { return web3_js_1.PublicKey; } });
Object.defineProperty(exports, "Keypair", { enumerable: true, get: function () { return web3_js_1.Keypair; } });
Object.defineProperty(exports, "LAMPORTS_PER_SOL", { enumerable: true, get: function () { return web3_js_1.LAMPORTS_PER_SOL; } });
var anchor_1 = require("@coral-xyz/anchor");
Object.defineProperty(exports, "Wallet", { enumerable: true, get: function () { return anchor_1.Wallet; } });
