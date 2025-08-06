import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { BomboclatSDK } from '../sdk';
import { BN } from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import fs from 'fs';

// Example: Place bids on auction slots
async function placeBidExample() {
  console.log('💰 Placing bid example...\n');

  // Setup connection and wallet
  const connection = new Connection('http://127.0.0.1:8899', 'confirmed');
  const walletKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(
      process.env.SOLANA_KEYPAIR_PATH || `${require('os').homedir()}/.config/solana/id.json`, 
      'utf8'
    )))
  );
  const wallet = new NodeWallet(walletKeypair);

  // Load IDL
  const idl = JSON.parse(fs.readFileSync('./src/idl/bomboclat.json', 'utf8'));
  const sdk = new BomboclatSDK(connection, wallet, idl);

  // Auction details (replace with actual auction)
  const auctionData = new PublicKey('YOUR_AUCTION_DATA_PUBKEY');
  const tokenMint = new PublicKey('YOUR_TOKEN_MINT_PUBKEY');
  const slotId = 1;
  const bidAmount = new BN(100_000_000); // 0.1 SOL

  try {
    // Smart bid - automatically determines if first bid or outbid
    const result = await sdk.bidding.placeBid(auctionData, tokenMint, slotId, bidAmount);
    
    console.log('✅ Bid placed successfully!');
    console.log('  - Transaction:', result.tx);
    console.log('  - Action:', result.action);
    console.log('  - Amount:', bidAmount.toNumber() / 1e9, 'SOL');

  } catch (error: any) {
    console.error('❌ Failed to place bid:', error.message);
  }
}

placeBidExample().catch(console.error); 