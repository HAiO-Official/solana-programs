# HAiO Solana Programs

## Overview

This repository contains the Solana programs for the HAiO project, built with the Anchor framework. Our programs are open-source to ensure transparency and encourage community collaboration.

## Programs

### 1. Early-Access Program

A smart contract that manages early participant benefits

## Quick Start

### Prerequisites

- [Rust](https://rustup.rs/) with `rustup`
- [Solana CLI Tools](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor CLI](https://www.anchor-lang.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/haio-solana-programs
cd haio-solana-programs

# Install dependencies
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
│   └── early-access/        # Early-Access program source
│       ├── Cargo.toml
│       └── src/
├── tests/                   # Test files
├── Anchor.toml             # Anchor configuration
├── Cargo.toml              # Rust workspace configuration
└── security.txt            # Security policy
```

## Program Addresses

| Program      | Devnet                                        | Mainnet                                       |
| ------------ | --------------------------------------------- | --------------------------------------------- |
| Early-Access | `jg82rRko6Hu1KqZ47RR95Jrq1cfqBhaAPXStseajmfQ` | `jg82rRko6Hu1KqZ47RR95Jrq1cfqBhaAPXStseajmfQ` |

## Security

- For security concerns, please review our [`security.txt`](./security.txt)
- Report vulnerabilities to: cto@haiomusic.com

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Contact & Support

- Email: cto@haiomusic.com

## Acknowledgments

- Solana Foundation
- Anchor Framework Team
- Our Contributors
