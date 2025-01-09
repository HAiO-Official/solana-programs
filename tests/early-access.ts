import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { expect } from "chai";
import fs from "fs";
import { EarlyAccess } from "../target/types/early_access";

// Utility function for SHA-256 hashing
import crypto from "crypto";
function sha256(data: Buffer): Buffer {
  return crypto.createHash("sha256").update(data).digest();
}

// Type definition for received events
type ReceivedEvent = {
  event: any;
  slot: number;
  listener: number;
};

const DEVNET_USERS_PATH = "tests/devnet-users.json";

describe("early_access", () => {
  // Configure the client to use devnet
  const connection = new anchor.web3.Connection(
    "https://api.devnet.solana.com"
  );
  const wallet = anchor.Wallet.local();
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  anchor.setProvider(provider);

  const program = anchor.workspace.EarlyAccess as Program<EarlyAccess>;
  let users: Keypair[] = [];
  let onChainLogs: { [pubkey: string]: Uint8Array } = {};

  before(async () => {
    // Load or generate test wallets
    if (fs.existsSync(DEVNET_USERS_PATH)) {
      const usersData = JSON.parse(fs.readFileSync(DEVNET_USERS_PATH, "utf-8"));
      users = usersData.map((userData) =>
        Keypair.fromSecretKey(new Uint8Array(userData))
      );
      console.log("Loaded test wallets from:", DEVNET_USERS_PATH);
    } else {
      for (let i = 0; i < 3; i++) {
        users.push(Keypair.generate());
      }
      const usersData = users.map((user) => Array.from(user.secretKey));
      fs.writeFileSync(DEVNET_USERS_PATH, JSON.stringify(usersData));
      console.log("Generated and saved test wallets to:", DEVNET_USERS_PATH);
    }

    // Transfer SOL to test wallets
    const transferPromises = users.map(async (user) => {
      const ix = SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: user.publicKey,
        lamports: 0.001 * LAMPORTS_PER_SOL,
      });

      const tx = new Transaction().add(ix);

      try {
        const txid = await provider.sendAndConfirm(tx, [wallet.payer]);
        console.log(
          `Funded ${user.publicKey.toBase58()} with 0.001 SOL. Txid: ${txid}`
        );
      } catch (error) {
        console.error(`Failed to fund ${user.publicKey.toBase58()}:`, error);
      }
    });

    await Promise.all(transferPromises);
  });

  it("should register users and emit hashed pubkeys", async () => {
    const receivedEvents: ReceivedEvent[] = [];
    let listener = null;

    const eventPromise = new Promise((resolve) => {
      listener = program.addEventListener("earlyAccessEvent", (event, slot) => {
        receivedEvents.push({ event, slot, listener });
        if (receivedEvents.length === users.length) {
          resolve(receivedEvents);
        }
      });
    });

    // Execute early_access instruction for all users in parallel
    const txSigs = await Promise.all(
      users.map((user) =>
        program.methods
          .earlyAccess()
          .accounts({
            signer: user.publicKey,
          })
          .signers([user])
          .rpc()
          .catch((error) => {
            console.error("Error in earlyAccess RPC:", error);
            return null;
          })
      )
    );

    // Wait for transaction confirmations
    await Promise.all(
      txSigs
        .filter((txSig) => txSig !== null)
        .map((txSig) =>
          provider.connection.confirmTransaction(txSig, "confirmed")
        )
    );

    await eventPromise;
    await program.removeEventListener(listener);

    // Verify and store emitted events
    for (const user of users) {
      const userPubkeyStr = user.publicKey.toBase58();
      const event = receivedEvents.find((e) =>
        Buffer.from(e.event.hashedPubkey).equals(
          sha256(user.publicKey.toBuffer())
        )
      );
      expect(event).to.not.be.undefined;
      onChainLogs[userPubkeyStr] = event.event.hashedPubkey;
    }

    // Verify stored hashes
    for (const user of users) {
      const userPubkeyStr = user.publicKey.toBase58();
      const loggedHash = onChainLogs[userPubkeyStr];
      const expectedHash = sha256(user.publicKey.toBuffer());

      expect(loggedHash).to.not.be.undefined;
      expect(Buffer.from(loggedHash).equals(expectedHash)).to.be.true;
    }
  });

  it("should verify off-chain hash matches on-chain stored hash", async () => {
    for (let i = 0; i < users.length; i++) {
      const userPubkeyStr = users[i].publicKey.toBase58();
      const userHash = sha256(Buffer.from(users[i].publicKey.toBytes()));
      const loggedHash = onChainLogs[userPubkeyStr];

      expect(loggedHash).to.not.be.undefined;
      expect(Buffer.from(loggedHash).equals(userHash)).to.be.true;
    }
  });

  it("should not find hash for unregistered wallet", async () => {
    const newUser = Keypair.generate();
    const newUserPubkeyStr = newUser.publicKey.toBase58();
    const newUserHash = sha256(Buffer.from(newUser.publicKey.toBytes()));
    const loggedHash = onChainLogs[newUserPubkeyStr];

    expect(loggedHash).to.be.undefined;
  });
});
