import { Keypair, PublicKey } from '@solana/web3.js';
import { BomboclatSDK, createConnection } from '../sdk';
import { BN } from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import fs from 'fs';
import 'dotenv/config';

// Example: Listen to auction events
async function eventListeningExample() {
  console.log('📡 Event listening example...\n');

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

  try {
    // Start event listening
    await sdk.events.startEventListening();
    console.log('✅ Event listening started');

    // Subscribe to specific event types
    const bidPlacedSub = sdk.events.onAuctionEvent(
      { eventType: 'BidPlaced' },
      (event) => {
        console.log('💰 Bid placed event:');
        console.log('  - Auction:', event.auction);
        if (event.type === 'BidPlaced') {
          console.log('  - Bidder:', event.bidder);
          console.log('  - Slot:', event.slotId);
          console.log('  - Amount:', event.amount);
        }
      }
    );

    const auctionEndedSub = sdk.events.onAuctionEvent(
      { eventType: 'AuctionEnded' },
      (event) => {
        console.log('🏁 Auction ended event:');
        console.log('  - Auction:', event.auction);
        console.log('  - Token mint:', event.tokenMint);
      }
    );

    // Subscribe to all events
    const allEventsSub = sdk.events.onAllAuctionEvents((event) => {
      console.log(`📢 All events: ${event.type} for auction ${event.auction}`);
    });

    console.log('✅ Event subscriptions created');
    console.log('  - Listening for BidPlaced events');
    console.log('  - Listening for AuctionEnded events');
    console.log('  - Listening for all events');

    // Keep listening for 30 seconds
    console.log('\n⏰ Listening for events for 30 seconds...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Clean up
    sdk.events.offAuctionEvent(bidPlacedSub);
    sdk.events.offAuctionEvent(auctionEndedSub);
    sdk.events.offAuctionEvent(allEventsSub);
    await sdk.events.stopEventListening();
    console.log('✅ Event listening stopped');

  } catch (error: any) {
    console.error('❌ Failed to setup event listening:', error.message);
  }
}

eventListeningExample().catch(console.error); 