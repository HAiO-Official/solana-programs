import * as anchor from "@coral-xyz/anchor";
import { Program, EventParser } from "@coral-xyz/anchor";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createMint,
  getAccount,
} from "@solana/spl-token";
import { assert } from "chai";
import { CreateAta } from "../target/types/create_ata";

describe("create_ata", () => {
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);

  const program = anchor.workspace.CreateAta as Program<CreateAta>;

  const payer = Keypair.generate();
  const mintAuthority = Keypair.generate();
  const DEVNET_MINT = new PublicKey(
    "hahpdZ72xVKVGnyuFVkJUFSTQNLecruFXo1QRQGagFw"
  );
  let userAta: PublicKey;

  before(async () => {
    let mint = DEVNET_MINT;
    userAta = await getAssociatedTokenAddress(mint, payer.publicKey);
  });

  it("First call: should create ATA if needed and emit AtaCallEvent (created_this_tx=true)", async () => {
    const txSig = await program.methods
      .ensureHolder()
      .accounts({
        payer: payer.publicKey,
        mint: DEVNET_MINT,
        userAta: userAta,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([payer])
      .rpc();

    await provider.connection.confirmTransaction(txSig, "confirmed");
    const ataAccount = await getAccount(provider.connection, userAta);
    assert.ok(ataAccount.address.equals(userAta), "ATA address mismatch");
    assert.ok(ataAccount.mint.equals(DEVNET_MINT), "Mint address mismatch");
    assert.ok(ataAccount.owner.equals(payer.publicKey), "Owner mismatch");

    // Parse logs and check the event
    const txInfo = await provider.connection.getTransaction(txSig, {
      commitment: "confirmed",
    });
    if (txInfo && txInfo.meta) {
      const parser = new EventParser(program.programId, program.coder);
      const events = Array.from(parser.parseLogs(txInfo.meta.logMessages));
      const ataCallEvent = events.find(
        (e) => (e as any).name === "AtaCallEvent"
      );
      assert.isNotNull(ataCallEvent, "AtaCallEvent not emitted");
      assert.equal(
        (ataCallEvent as any).data.createdThisTx,
        true,
        "created_this_tx should be true on first call"
      );
      // Only one event should be emitted
      assert.equal(
        events.filter((e) => (e as any).name === "AtaCallEvent").length,
        1,
        "Only one AtaCallEvent should be emitted"
      );
    }
  });

  it("Second call: should not create ATA and emit AtaCallEvent (created_this_tx=false)", async () => {
    const txSig = await program.methods
      .ensureHolder()
      .accounts({
        payer: payer.publicKey,
        mint: DEVNET_MINT,
        userAta: userAta,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([payer])
      .rpc();

    await provider.connection.confirmTransaction(txSig, "confirmed");
    const txInfo = await provider.connection.getTransaction(txSig, {
      commitment: "confirmed",
    });
    if (txInfo && txInfo.meta) {
      const parser = new EventParser(program.programId, program.coder);
      const events = Array.from(parser.parseLogs(txInfo.meta.logMessages));
      const ataCallEvent = events.find(
        (e) => (e as any).name === "AtaCallEvent"
      );
      assert.isNotNull(ataCallEvent, "AtaCallEvent not emitted");
      assert.equal(
        (ataCallEvent as any).data.createdThisTx,
        false,
        "created_this_tx should be false on second call"
      );
      // Only one event should be emitted
      assert.equal(
        events.filter((e) => (e as any).name === "AtaCallEvent").length,
        1,
        "Only one AtaCallEvent should be emitted"
      );
    }
  });
});
