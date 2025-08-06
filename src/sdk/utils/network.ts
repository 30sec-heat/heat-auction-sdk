import { Connection, Commitment } from '@solana/web3.js';

/**
 * Create a Solana connection from environment variables
 */
export function createConnection(): Connection {
  const rpcUrl = process.env.SOLANA_RPC_URL!;
  const commitment = (process.env.SOLANA_COMMITMENT as Commitment) || 'confirmed';
  
  return new Connection(rpcUrl, commitment);
}