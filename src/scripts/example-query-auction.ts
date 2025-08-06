import { Keypair, PublicKey } from '@solana/web3.js';
import { BomboclatSDK, createConnection } from '../sdk';
import { BN } from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import fs from 'fs';
import 'dotenv/config';

// Example: Query auction state and slot information
async function queryAuctionExample() {
  console.log('📊 Querying auction example...\n');

  // Setup connection and wallet
  const connection = createConnection();
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
  const slotId = 1;

  try {
    // Get auction state
    const auctionState = await sdk.queries.getAuctionState(auctionData);
    console.log('🏗️ Auction State:');
    console.log('  - Token mint:', auctionState.tokenMint.toBase58());
    console.log('  - Creator:', auctionState.creator.toBase58());
    console.log('  - Is active:', auctionState.isActive);
    console.log('  - Start time:', new Date(auctionState.startTime.toNumber() * 1000).toISOString());
    console.log('  - End time:', new Date(auctionState.endTime.toNumber() * 1000).toISOString());

    // Get current bid info for a slot
    const bidInfo = await sdk.bidding.getCurrentBidInfo(auctionData, slotId);
    console.log(`\n💰 Slot ${slotId} Bid Info:`);
    console.log('  - Has bid:', bidInfo.hasBid);
    if (bidInfo.hasBid) {
      console.log('  - Current bidder:', bidInfo.currentBidder?.toBase58());
      console.log('  - Current amount:', bidInfo.currentAmount?.toNumber() / 1e9, 'SOL');
      console.log('  - Min next bid:', bidInfo.minNextBid?.toNumber() / 1e9, 'SOL');
    }

    // Check if current user is highest bidder
    const isHighest = await sdk.bidding.isCurrentUserHighestBidder(auctionData, slotId);
    console.log(`\n👤 Are you highest bidder on slot ${slotId}:`, isHighest);

  } catch (error: any) {
    console.error('❌ Failed to query auction:', error.message);
  }
}

queryAuctionExample().catch(console.error); 