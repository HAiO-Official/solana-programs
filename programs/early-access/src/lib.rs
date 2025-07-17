use anchor_lang::prelude::*;
use sha2::{Digest, Sha256};

#[cfg(not(feature = "no-entrypoint"))]
use solana_security_txt::security_txt;

#[cfg(not(feature = "no-entrypoint"))]
security_txt! {
    name: "HAiO Early Access Program",
    project_url: "https://haio.fun",
    contacts: "email:cto@haio.fun",
    policy: "We do not pay a bug bounty.",
    preferred_languages: "en",
    source_code: "https://github.com/HAiO-labs/solana-programs",
    source_revision: "main"
}

declare_id!("jg82rRko6Hu1KqZ47RR95Jrq1cfqBhaAPXStseajmfQ");

#[program]
pub mod early_access {
    use super::*;

    pub fn early_access(ctx: Context<EarlyAccess>) -> Result<()> {
        emit!(EarlyAccessEvent {
            hashed_pubkey: hash_pubkey(&ctx.accounts.signer.key()),
            timestamp: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }
}

fn hash_pubkey(pubkey: &Pubkey) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(pubkey.as_ref());
    hasher.finalize().into()
}

#[event]
pub struct EarlyAccessEvent {
    pub hashed_pubkey: [u8; 32],
    pub timestamp: i64,
}

#[derive(Accounts)]
pub struct EarlyAccess<'info> {
    /// CHECK: Only used for signing & hashing the public key
    #[account(signer)]
    pub signer: AccountInfo<'info>,
}
