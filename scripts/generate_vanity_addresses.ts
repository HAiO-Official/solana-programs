import { Keypair, PublicKey } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";

// Vanity address generation settings
const TARGET_PREFIXES = {
  PROGRAM: { prefix: "haio", caseSensitive: false }, // For program ID (case-insensitive)
};

// ==================================================================
// Logic to be executed in worker threads (each CPU core runs this)
// ==================================================================
if (!isMainThread) {
  const { targetConfig, addressType } = workerData;
  const { prefix, caseSensitive } = targetConfig;
  const prefixLength = prefix.length;
  let attempts = 0;

  while (true) {
    const keypair = Keypair.generate();
    const address = keypair.publicKey.toBase58();
    attempts++;

    // Log progress every 1,000,000 attempts
    if (attempts % 1000000 === 0) {
      parentPort?.postMessage({
        type: "progress",
        attempts,
        addressType,
      });
    }

    // Address checking logic
    const addressPrefix = address.substring(0, prefixLength);
    const targetPrefix = caseSensitive ? prefix : prefix.toLowerCase();
    const comparePrefix = caseSensitive
      ? addressPrefix
      : addressPrefix.toLowerCase();

    if (comparePrefix === targetPrefix) {
      // If found, send secretKey to parent thread and exit
      parentPort?.postMessage({
        type: "found",
        address: address,
        secretKey: keypair.secretKey,
        attempts,
        addressType,
      });
      process.exit(0);
    }
  }
}

// ==================================================================
// Logic to be executed in the main thread (manages workers)
// ==================================================================

/**
 * Optimized function to generate vanity addresses using all CPU cores
 * @param targetConfig Target address settings (prefix, caseSensitive)
 * @param addressType Address type (PROGRAM)
 * @returns Found Keypair object
 */
function generateVanityKeypair(
  targetConfig: { prefix: string; caseSensitive: boolean },
  addressType: string
): Promise<Keypair> {
  const caseInfo = targetConfig.caseSensitive
    ? "case-sensitive"
    : "case-insensitive";
  console.log(
    `🎯 Generating ${addressType} vanity address starting with "${targetConfig.prefix}" (${caseInfo}) using all CPU cores...`
  );

  return new Promise((resolve, reject) => {
    const numCpus = os.cpus().length;
    console.log(`💻 Utilizing ${numCpus} CPU cores for generation.`);
    const workers: Worker[] = [];
    let found = false;
    let totalProgress = 0;

    for (let i = 0; i < numCpus; i++) {
      const worker = new Worker(__filename, {
        workerData: { targetConfig, addressType },
      });

      worker.on("message", (result) => {
        if (result.type === "progress") {
          totalProgress += 1000000;
          console.log(
            `⏳ ${
              result.addressType
            }: Searched ${totalProgress.toLocaleString()} addresses so far...`
          );
          return;
        }

        if (result.type === "found" && !found) {
          found = true;

          const keypair = Keypair.fromSecretKey(result.secretKey);
          console.log(`🎉 FOUND ${result.addressType} vanity address!`);
          console.log(`✅ Address: ${result.address}`);
          console.log(`📊 Total attempts: ${result.attempts.toLocaleString()}`);

          // Terminate all workers
          workers.forEach((w) => w.terminate());
          resolve(keypair);
        }
      });

      worker.on("error", (err) => {
        console.error("A worker encountered an error:", err);
        if (!found) {
          found = true;
          workers.forEach((w) => w.terminate());
          reject(err);
        }
      });

      worker.on("exit", (code) => {
        if (code !== 0 && !found) {
          console.error(`Worker stopped with exit code ${code}`);
        }
      });

      workers.push(worker);
    }
  });
}

function saveKeypair(keypair: Keypair, filename: string): void {
  const keypairArray = Array.from(keypair.secretKey);
  const keysDir = path.join(__dirname, "../keys");

  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
  }

  const filepath = path.join(keysDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(keypairArray));
  console.log(`💾 Keypair saved to: ${filepath}`);
}

async function main() {
  console.log("🚀 HAiO Vanity Address Generator");
  console.log("📋 Target Prefix:");
  console.log(
    `   • Program ID: "${TARGET_PREFIXES.PROGRAM.prefix}" (case-insensitive)`
  );
  console.log(`⚠️  This may take a while depending on the prefix length...\n`);

  // Generate keypair for program ID only
  console.log("🔧 Generating Program ID vanity address...");
  const programKeypair = await generateVanityKeypair(
    TARGET_PREFIXES.PROGRAM,
    "PROGRAM"
  );

  if (programKeypair) {
    saveKeypair(programKeypair, "haio_program.json");
    console.log(`🏗️  Program ID: ${programKeypair.publicKey.toBase58()}\n`);
  } else {
    console.log("❌ Failed to generate program vanity address\n");
  }

  // Result summary
  console.log("📋 Generation Summary:");

  if (programKeypair) {
    console.log("✅ Program ID generated successfully");
    console.log(`   Address: ${programKeypair.publicKey.toBase58()}`);
    console.log(`   File: keys/haio_program.json`);
  }

  if (programKeypair) {
    console.log("\n📋 Next Steps:");
    console.log("1. Update Anchor.toml with new program ID");
    console.log("2. Update lib.rs declare_id! with new program ID");
    console.log("3. Rebuild and redeploy the program");
  }

  // Generate vanity config file
  if (programKeypair) {
    const vanityConfig = {
      programId: programKeypair.publicKey.toBase58(),
      generatedAt: new Date().toISOString(),
      targetPrefixes: {
        program: `${TARGET_PREFIXES.PROGRAM.prefix} (case-insensitive)`,
      },
    };

    const configPath = path.join(__dirname, "../.haio-vanity-config.json");
    fs.writeFileSync(configPath, JSON.stringify(vanityConfig, null, 2));
    console.log(`📄 Vanity config saved to: ${configPath}`);
  }
}

// Only execute main() in the main thread
if (isMainThread) {
  const startTime = Date.now();
  main()
    .catch((err) => {
      console.error("❌ Error:", err);
      process.exit(1);
    })
    .finally(() => {
      const duration = (Date.now() - startTime) / 1000;
      console.log(`⏱️  Total generation time: ${duration.toFixed(2)} seconds`);
    });
}
