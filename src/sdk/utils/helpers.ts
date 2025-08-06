import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

// Helper functions
export function formatSolAmount(lamports: BN): string {
  return (lamports.toNumber() / 1e9).toFixed(9);
}

export function formatTokenAmount(amount: BN, decimals: number = 9): string {
  return (amount.toNumber() / Math.pow(10, decimals)).toFixed(decimals);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  return fn().catch(async (error) => {
    if (maxRetries <= 0) throw error;
    await sleep(delay);
    return retry(fn, maxRetries - 1, delay * 2);
  });
} 