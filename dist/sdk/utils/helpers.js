"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatSolAmount = formatSolAmount;
exports.formatTokenAmount = formatTokenAmount;
exports.sleep = sleep;
exports.retry = retry;
// Helper functions
function formatSolAmount(lamports) {
    return (lamports.toNumber() / 1e9).toFixed(9);
}
function formatTokenAmount(amount, decimals = 9) {
    return (amount.toNumber() / Math.pow(10, decimals)).toFixed(decimals);
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function retry(fn, maxRetries = 3, delay = 1000) {
    return fn().catch(async (error) => {
        if (maxRetries <= 0)
            throw error;
        await sleep(delay);
        return retry(fn, maxRetries - 1, delay * 2);
    });
}
