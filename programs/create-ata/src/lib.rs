use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

#[cfg(not(feature = "no-entrypoint"))]
use solana_security_txt::security_txt;

#[cfg(not(feature = "no-entrypoint"))]
security_txt! {
    name: "HAiO Create ATA Program",
    project_url: "https://haio.fun",
    contacts: "email:cto@haio.fun",
    policy: "We do not pay a bug bounty.",
    preferred_languages: "en",
    source_code: "https://github.com/HAiO-labs/solana-programs",
    source_revision: "main"
}

declare_id!("HAiowc2WWGp3VwVjpAtiduLCwWQmQqVPQgLbn5jurM8o");

pub const MY_TOKEN_MINT: Pubkey = pubkey!("haioZJAWTMaR4SFhZRwFBBejnGDPiwLTqrDiKpwH31h");

#[program]
pub mod create_ata {
    use super::*;

    pub fn ensure_holder(ctx: Context<EnsureHolder>) -> Result<()> {
        let created_this_tx = ctx.accounts.user_ata.to_account_info().data_is_empty();
        emit!(AtaCallEvent {
            wallet: ctx.accounts.payer.key(),
            ata: ctx.accounts.user_ata.key(),
            created_this_tx,
            timestamp: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct EnsureHolder<'info> {
    /// Account that pays transaction fees and rent
    #[account(mut)]
    pub payer: Signer<'info>,

    /// Service token mint
    #[account(address = MY_TOKEN_MINT)]
    pub mint: Account<'info, Mint>,

    /// User's ATA (created if needed)
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer,
    )]
    pub user_ata: Account<'info, TokenAccount>,

    /// System program
    pub system_program: Program<'info, System>,
    /// Token program
    pub token_program: Program<'info, Token>,
    /// Associated Token Account program
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[event]
pub struct AtaCallEvent {
    pub wallet: Pubkey,
    pub ata: Pubkey,
    pub created_this_tx: bool,
    pub timestamp: i64,
} 