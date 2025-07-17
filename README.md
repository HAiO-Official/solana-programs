[![MOVED](https://img.shields.io/badge/STATUS-MOVED-blue?style=for-the-badge)](https://github.com/HAiO-labs/HAiO-solana-programs)

# 🚚 This repository is no longer updated.
👉 **Active development has moved to [`HAiO-solana-programs`](https://github.com/HAiO-labs/HAiO-solana-programs).**

---
# HAiO Solana Programs

## Overview

This repository contains Solana programs built with the Anchor framework for the HAiO project.  
All programs are open-source to ensure transparency and foster community collaboration.

## Programs

### 1. Early-Access Program

- Uses SHA-256 hashing of participant's public key for privacy protection
- Emits an event containing only the hashed wallet address and timestamp
- Requires only transaction signature verification
- No on-chain state storage (completely stateless design)

### 2. Daily Check-In Program

A Solana program allowing each user (wallet) to check in once per day (UTC-based).

- Uses a PDA (Program Derived Address) seeded by `["user-check-in", authority.pubkey]`.
- Emits an event on successful daily check-in.
- Fails if the user already checked in on the same day.

### 3. Create ATA Program

A Solana program that ensures a user has an Associated Token Account (ATA) for a specific service token, creating it if needed, and always emits a single on-chain event per call.

- Automatically creates the ATA for the user if it does not exist
- Skips ATA creation if it already exists
- Always emits a single event (`AtaCallEvent`) per call
- The event field `created_this_tx` is `true` if the ATA was created in this transaction, or `false` if it already existed

## Quick Start

### Prerequisites

- [Rust](https://rustup.rs/) with `rustup`
- [Solana CLI Tools](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor CLI](https://www.anchor-lang.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/HAiO-labs/solana-programs
cd solana-programs

# Install dependencies (using yarn, npm, or whichever package manager your project prefers)
yarn install

```

### Build and Test

```bash
# Build all programs
anchor build

# Run tests
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

## Repository Structure

```
haio-solana-programs/
├── programs/
│   ├── early-access/        # Early-Access program source
│   │   ├── src/
│   │   │   └── lib.rs
│   │   └── Cargo.toml
│   ├── daily-check-in/     # Daily Check-In program source
│   │   ├── src/
│   │   │   └── lib.rs
│   │   └── Cargo.toml
│   ├── create-ata/        # Create ATA program source
│   │   ├── src/
│   │   │   └── lib.rs
│   │   └── Cargo.toml
├── tests/                   # Test files
├── Anchor.toml             # Anchor configuration
├── Cargo.toml              # Rust workspace configuration
└── security.txt            # Security policy
```

## Program Addresses

| Program        | Devnet                                         | Mainnet                                        |
| -------------- | ---------------------------------------------- | ---------------------------------------------- |
| Early-Access   | `jg82rRko6Hu1KqZ47RR95Jrq1cfqBhaAPXStseajmfQ`  | `jg82rRko6Hu1KqZ47RR95Jrq1cfqBhaAPXStseajmfQ`  |
| Daily Check-In | `haio6iJNBgiAcm6DfxbqAfwNpsqhd4n2qswjPNhxuzF`  | `haio6iJNBgiAcm6DfxbqAfwNpsqhd4n2qswjPNhxuzF`  |
| Create ATA     | `HAiowc2WWGp3VwVjpAtiduLCwWQmQqVPQgLbn5jurM8o` | `HAiowc2WWGp3VwVjpAtiduLCwWQmQqVPQgLbn5jurM8o` |

## Security

- For security concerns, please review our [`security.txt`](./security.txt)
- Report vulnerabilities to: cto@haio.fun

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Contact & Support

- Email: cto@haio.fun

## Acknowledgments

- Solana Foundation
- Anchor Framework Team
- Our Contributors

## Notes

- **Security.txt**: The references in `security_txt! { ... }` will appear on-chain if deployed without the `"no-entrypoint"` feature. This is optional but can help define security policies for your Solana program.
- **Program ID**: Ensure the `declare_id!()` matches the keypair used in `Anchor.toml` or your deployment process.
- **Testing**: The test code demonstrates using `EventParser` to ensure an event is actually emitted. If you prefer, you could also do manual base64 decoding.
