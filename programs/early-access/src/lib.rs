use anchor_lang::prelude::*;
use sha2::{Digest, Sha256};

declare_id!("jg82rRko6Hu1KqZ47RR95Jrq1cfqBhaAPXStseajmfQ");

#[program]
/// Early Access Program for user registration
pub mod early_access {
    use super::*;

    /// Register user's wallet address and emit hashed pubkey
    /// @param ctx The context containing signer information
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

// 컨텍스트 구조체
#[derive(Accounts)]
pub struct EarlyAccess<'info> {
    /// CHECK: This account is only used for signing and its key is hashed
    /// No additional validation is required as we only need the public key
    #[account(signer)]
    pub signer: AccountInfo<'info>,
}