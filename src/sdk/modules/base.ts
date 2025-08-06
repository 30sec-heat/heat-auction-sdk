import { Connection } from '@solana/web3.js';
import type { Wallet } from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Bomboclat } from '../../idl/bomboclat';

export class BaseModule {
  protected program: Program<Bomboclat>;
  protected connection: Connection;
  protected wallet: Wallet;
  
  constructor(program: Program<Bomboclat>, connection: Connection, wallet: Wallet) {
    this.program = program;
    this.connection = connection;
    this.wallet = wallet;
  }
} 