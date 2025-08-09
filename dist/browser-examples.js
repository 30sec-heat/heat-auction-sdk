"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserHeatSDK = void 0;
exports.exampleBrowserUsage = exampleBrowserUsage;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const anchor_1 = require("@coral-xyz/anchor");
// Constants (same as SDK)
const PROGRAM_ID = new web3_js_1.PublicKey('YOUR_PROGRAM_ID_HERE');
const TOKEN_METADATA_PROGRAM_ID = new web3_js_1.PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
// Browser-compatible PDA derivation using TextEncoder
function getAuctionEscrowPDA(auctionData) {
    const textEncoder = new TextEncoder();
    const auctionEscrowBytes = textEncoder.encode('auction_escrow');
    return web3_js_1.PublicKey.findProgramAddressSync([auctionEscrowBytes, auctionData.toBuffer()], PROGRAM_ID);
}
function getSlotBidPDA(auctionData, slotId) {
    const textEncoder = new TextEncoder();
    const slotBidBytes = textEncoder.encode('slot_bid');
    const slotIdBN = typeof slotId === 'number' ? new anchor_1.BN(slotId) : slotId;
    // Convert BN to Uint8Array for browser compatibility
    const slotIdBytes = new Uint8Array(8);
    const slotIdNumber = slotIdBN.toNumber();
    for (let i = 0; i < 8; i++) {
        slotIdBytes[i] = (slotIdNumber >> (i * 8)) & 0xff;
    }
    return web3_js_1.PublicKey.findProgramAddressSync([slotBidBytes, auctionData.toBuffer(), slotIdBytes], PROGRAM_ID);
}
// Browser-compatible SDK alternative
class BrowserHeatSDK {
    constructor(connection, wallet, idl) {
        this.connection = connection;
        this.wallet = wallet;
        const provider = new anchor_1.AnchorProvider(connection, wallet, { commitment: 'confirmed' });
        this.program = new anchor_1.Program(idl, provider);
    }
    // Place first bid (browser-compatible)
    async placeFirstBid(auctionData, mint, slotId, bidAmount) {
        const [slotBidPDA] = getSlotBidPDA(auctionData, slotId);
        const [auctionEscrow] = getAuctionEscrowPDA(auctionData);
        const bidderTokenAccount = await (0, spl_token_1.getAssociatedTokenAddress)(mint, this.wallet.publicKey);
        const tx = await this.program.methods
            .placeFirstBid(new anchor_1.BN(slotId), bidAmount)
            .accountsStrict({
            auctionState: auctionData, // You'll need to derive this
            auctionData,
            slotBid: slotBidPDA,
            bidder: this.wallet.publicKey,
            bidderTokenAccount,
            auctionEscrow,
            mint,
            systemProgram: web3_js_1.SystemProgram.programId,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            associatedTokenProgram: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
        })
            .rpc();
        return tx;
    }
    // Get auction data (browser-compatible)
    async getAuctionData(auctionData) {
        return await this.program.account.auctionData.fetch(auctionData);
    }
    // Get auction state (browser-compatible)
    async getAuctionState(auctionData) {
        // You'll need to derive the auction state PDA
        const textEncoder = new TextEncoder();
        const auctionStateBytes = textEncoder.encode('auction_state');
        const [auctionStatePDA] = web3_js_1.PublicKey.findProgramAddressSync([auctionStateBytes, auctionData.toBuffer()], PROGRAM_ID);
        return await this.program.account.auctionState.fetch(auctionStatePDA);
    }
    // Get slot bid (browser-compatible)
    async getSlotBid(auctionData, slotId) {
        const [slotBidPDA] = getSlotBidPDA(auctionData, slotId);
        return await this.program.account.slotBid.fetch(slotBidPDA);
    }
}
exports.BrowserHeatSDK = BrowserHeatSDK;
// Example usage in browser - copy this pattern to your browser code
async function exampleBrowserUsage(wallet) {
    // Connect to wallet (Phantom, etc.)
    const connection = new web3_js_1.Connection('https://api.mainnet-beta.solana.com');
    // Load IDL (you'll need to include this in your bundle)
    const idl = {}; // Load your IDL here
    const sdk = new BrowserHeatSDK(connection, wallet, idl);
    // Example: Place a bid
    const auctionData = new web3_js_1.PublicKey('YOUR_AUCTION_DATA');
    const mint = new web3_js_1.PublicKey('YOUR_TOKEN_MINT');
    const slotId = 1;
    const bidAmount = new anchor_1.BN(1 * web3_js_1.LAMPORTS_PER_SOL); // 1 SOL
    try {
        const tx = await sdk.placeFirstBid(auctionData, mint, slotId, bidAmount);
        console.log('Bid placed:', tx);
    }
    catch (error) {
        console.error('Failed to place bid:', error);
    }
}
