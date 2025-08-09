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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaceBidButton = PlaceBidButton;
const react_1 = __importStar(require("react"));
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@coral-xyz/anchor");
const browser_examples_1 = require("./browser-examples");
// Example React component showing complete user flow
function PlaceBidButton() {
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [success, setSuccess] = (0, react_1.useState)(null);
    const handlePlaceBid = async () => {
        setIsLoading(true);
        setError(null);
        setSuccess(null);
        try {
            // 1. Check if wallet is installed
            const wallet = window.solana;
            if (!wallet) {
                setError('Please install Phantom wallet');
                return;
            }
            // 2. Connect to wallet (triggers popup)
            if (!wallet.isConnected) {
                await wallet.connect();
            }
            // 3. Setup SDK
            const connection = new web3_js_1.Connection('https://api.mainnet-beta.solana.com');
            const idl = {}; // Load your IDL here
            const sdk = new browser_examples_1.BrowserHeatSDK(connection, wallet, idl);
            // 4. Place bid (triggers transaction approval popup)
            const auctionData = new web3_js_1.PublicKey('YOUR_AUCTION_DATA');
            const mint = new web3_js_1.PublicKey('YOUR_TOKEN_MINT');
            const slotId = 1;
            const bidAmount = new anchor_1.BN(1 * web3_js_1.LAMPORTS_PER_SOL);
            const tx = await sdk.placeFirstBid(auctionData, mint, slotId, bidAmount);
            // 5. Success!
            setSuccess(`Bid placed successfully! Transaction: ${tx}`);
        }
        catch (error) {
            setError(error.message);
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<div>
      <button onClick={handlePlaceBid} disabled={isLoading} style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: isLoading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
        }}>
        {isLoading ? 'Processing...' : 'Place Bid (1 SOL)'}
      </button>
      
      {error && (<p style={{ color: 'red', marginTop: '8px' }}>
          Error: {error}
        </p>)}
      
      {success && (<p style={{ color: 'green', marginTop: '8px' }}>
          {success}
        </p>)}
    </div>);
}
