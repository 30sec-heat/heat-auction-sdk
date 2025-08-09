"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const heat_sdk_1 = require("../heat-sdk");
const nodewallet_1 = __importDefault(require("@coral-xyz/anchor/dist/cjs/nodewallet"));
const fs_1 = __importDefault(require("fs"));
// Example: Close Auction Accounts (Treasury Only)
async function closeAuctionAccountsExample() {
    // Setup connection and wallet
    const connection = new web3_js_1.Connection('https://api.mainnet-beta.solana.com');
    const wallet = web3_js_1.Keypair.generate(); // Replace with actual wallet
    const nodeWallet = new nodewallet_1.default(wallet);
    // Load IDL from JSON file
    const idl = JSON.parse(fs_1.default.readFileSync('./src/idl/bomboclat.json', 'utf8'));
    // Create SDK instance with proper wallet interface
    const sdk = (0, heat_sdk_1.createHeatSDK)(connection, nodeWallet, idl);
    // Example auction data public key
    const auctionData = new web3_js_1.PublicKey('YOUR_AUCTION_DATA_PUBKEY_HERE');
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
    }
    catch (error) {
        console.error('❌ Failed to close auction accounts:', error);
    }
}
// Run the example
closeAuctionAccountsExample().catch(console.error);
