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

## Quick Start

### Prerequisites

- [Rust](https://rustup.rs/) with `rustup`
- [Solana CLI Tools](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor CLI](https://www.anchor-lang.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/HAiO-Official/solana-programs
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
├── tests/                   # Test files
├── Anchor.toml             # Anchor configuration
├── Cargo.toml              # Rust workspace configuration
└── security.txt            # Security policy
```

## Program Addresses

| Program        | Devnet                                        | Mainnet                                       |
| -------------- | --------------------------------------------- | --------------------------------------------- |
| Early-Access   | `jg82rRko6Hu1KqZ47RR95Jrq1cfqBhaAPXStseajmfQ` | `jg82rRko6Hu1KqZ47RR95Jrq1cfqBhaAPXStseajmfQ` |
| Daily Check-In | `haio6iJNBgiAcm6DfxbqAfwNpsqhd4n2qswjPNhxuzF` | TBD                                           |

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
- **Usage**: For real-world usage, you’d integrate this program with a front-end that calls instructions like `check_in` via wallet-adapter or Anchor’s client library.
