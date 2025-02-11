import * as anchor from "@coral-xyz/anchor";
import { Program, EventParser } from "@coral-xyz/anchor";
import { Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import { DailyCheckIn } from "../target/types/daily_check_in";

/**
 * This test suite verifies:
 * 1) A user can check in once per day.
 * 2) An event "checkInEvent" is emitted on success.
 * 3) A second check-in on the same day fails with error.
 * 4) Another user cannot reuse the existing PDA.
 */
describe("daily_check_in program (init_if_needed)", () => {
  // Configure the local Anchor provider
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);

  // Retrieve the compiled program object
  const program = anchor.workspace.DailyCheckIn as Program<DailyCheckIn>;

  // Keypair for test user
  const user = Keypair.generate();

  // Derive the user's check-in PDA
  let [userCheckInPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("user-check-in"), user.publicKey.toBuffer()],
    program.programId
  );

  // Provide SOL to the user for transaction fees
  it("Airdrop SOL for testing", async () => {
    const sig = await provider.connection.requestAirdrop(
      user.publicKey,
      1_000_000_000 // 1 SOL = 1,000,000,000 lamports
    );
    await provider.connection.confirmTransaction(sig);
  });

  it("First check_in() call => should succeed + emit event (via parseLogs)", async () => {
    try {
      // 1) Invoke "check_in"
      const txSig = await program.methods
        .checkIn()
        .accounts({
          userCheckIn: userCheckInPda,
          authority: user.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();
      console.log("First check-in tx =", txSig);

      // 2) Confirm and fetch transaction logs
      await provider.connection.confirmTransaction(txSig, "confirmed");
      const txInfo = await provider.connection.getTransaction(txSig, {
        commitment: "confirmed",
      });
      if (!txInfo || !txInfo.meta) {
        assert.fail("No transaction info found");
      }

      // 3) Fetch the user check-in account to confirm the state was updated
      const account = await program.account.userCheckInState.fetch(
        userCheckInPda
      );
      assert.ok(account.authority.equals(user.publicKey), "authority mismatch");
      assert.notEqual(
        account.lastCheckInDay.toNumber(),
        0,
        "checkInDay should not be 0"
      );

      // 4) Use EventParser to check for "checkInEvent" in logs
      console.log("Logs:", txInfo.meta.logMessages);
      const parser = new EventParser(program.programId, program.coder);
      let foundEvent = null;

      for (let e of parser.parseLogs(txInfo.meta.logMessages)) {
        console.log("Parsed event name:", e.name, " data:", e.data);
        // Anchor may output "checkInEvent" in lowercase
        if (e.name === "checkInEvent") {
          foundEvent = e.data;
          break;
        }
      }

      // 5) Ensure we found the event
      assert.isNotNull(foundEvent, "CheckInEvent should be present in logs");

      // 6) Verify the event data
      assert.equal(
        foundEvent.authority.toBase58(),
        user.publicKey.toBase58(),
        "Event authority mismatch"
      );
      assert.isAbove(
        foundEvent.checkInDay.toNumber(),
        0,
        "check_in_day invalid"
      );
    } catch (err) {
      console.error(err);
      assert.fail("First check_in should succeed.");
    }
  });

  it("Second check_in() (same day) => should fail + no event", async () => {
    try {
      // Attempt to check in a second time on the same day
      await program.methods
        .checkIn()
        .accounts({
          userCheckIn: userCheckInPda,
          authority: user.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      assert.fail("Second check_in on same day should fail");
    } catch (err: any) {
      console.log("Second check-in error:", err.error.errorMessage);
      assert.include(
        err.error.errorMessage,
        "You have already checked in today."
      );
    }
  });

  it("Try check_in() with a different user => seeds mismatch => fail + no event", async () => {
    const anotherUser = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      anotherUser.publicKey,
      1_000_000_000
    );
    await provider.connection.confirmTransaction(sig);

    try {
      // Another user attempts to check in using the same PDA -> seeds mismatch
      await program.methods
        .checkIn()
        .accounts({
          userCheckIn: userCheckInPda,
          authority: anotherUser.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([anotherUser])
        .rpc();
      assert.fail(
        "Should fail if another user tries to reuse the same account"
      );
    } catch (err: any) {
      console.log("Another user check_in error:", err.error.errorMessage);
      assert.include(err.error.errorMessage, "A seeds constraint was violated");
    }
  });
});
