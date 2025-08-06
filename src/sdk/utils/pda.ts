import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { PROGRAM_ID, TOKEN_METADATA_PROGRAM_ID } from '../constants';

// Helper functions for PDA derivation
export function getAuctionEscrowPDA(auctionData: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('auction_escrow'), auctionData.toBuffer()],
    PROGRAM_ID
  );
}

export function getSlotBidPDA(auctionData: PublicKey, slotId: number | BN): [PublicKey, number] {
  const slotIdBN = typeof slotId === 'number' ? new BN(slotId) : slotId;
  return PublicKey.findProgramAddressSync(
    [Buffer.from('slot_bid'), auctionData.toBuffer(), slotIdBN.toArrayLike(Buffer, 'le', 8)],
    PROGRAM_ID
  );
}

export function getMetadataPDA(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID
  );
} 