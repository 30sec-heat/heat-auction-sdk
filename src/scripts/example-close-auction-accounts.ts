import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { createHeatSDK } from '../heat-sdk';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import fs from 'fs';

// Example: Close Auction Accounts (Treasury Only)
async function closeAuctionAccountsExample() {
  // Setup connection and wallet
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const wallet = Keypair.generate(); // Replace with actual wallet
  const nodeWallet = new NodeWallet(wallet);
  
  // Load IDL from JSON file
  const idl = JSON.parse(fs.readFileSync('./src/idl/bomboclat.json', 'utf8'));
  
  // Create SDK instance with proper wallet interface
  const sdk = createHeatSDK(connection, nodeWallet, idl);
  
  // Example auction data public key
  const auctionData = new PublicKey('YOUR_AUCTION_DATA_PUBKEY_HERE');
  
  try {
    console.log('🔄 Closing auction accounts...');
    
    // Updated closeAuctionAccounts call with new required accounts
    const tx = await sdk.closeAuctionAccounts(auctionData);
    
    console.log('✅ Auction accounts closed successfully!');
    console.log('Transaction signature:', tx);
    
    // The SDK now automatically includes:
    // - treasuryTokenAccount (derived from auction escrow + token mint)
    // - mint (from auction_state.token_mint) ← NEW REQUIREMENT
    // - tokenProgram (TOKEN_PROGRAM_ID)
    // - systemProgram (SystemProgram.programId)
    // 
    // The function now burns remaining tokens before closing the token account
    // to prevent "Non-native account can only be closed if its balance is zero" error
    
  } catch (error) {
    console.error('❌ Failed to close auction accounts:', error);
  }
}

// Run the example
closeAuctionAccountsExample().catch(console.error);
