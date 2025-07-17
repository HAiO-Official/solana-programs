use anchor_lang::{prelude::*, system_program};

/// Security.txt information (only included if not building with "no-entrypoint" feature).
/// This helps define security contacts and project details on-chain.
#[cfg(not(feature = "no-entrypoint"))]
use solana_security_txt::security_txt;

#[cfg(not(feature = "no-entrypoint"))]
security_txt! {
    name: "HAiO Daily Check-In Program",
    project_url: "https://haio.fun",
    contacts: "email:cto@haio.fun",
    policy: "We do not pay a bug bounty.",
    preferred_languages: "en",
    source_code: "https://github.com/HAiO-labs/solana-programs",
    source_revision: "main"
}

/// Program ID for the daily_check_in program.
declare_id!("haio6iJNBgiAcm6DfxbqAfwNpsqhd4n2qswjPNhxuzF");

#[program]
pub mod daily_check_in {
    use super::*;

    /// The main instruction for daily check-in.
    /// This uses `init_if_needed` to create or reuse a user account (PDA),
    /// checks if the user has already checked in for the day, and emits an event on success.
    pub fn check_in(ctx: Context<CheckIn>) -> Result<()> {
        // 1) Get the current Unix timestamp
        let clock = Clock::get()?;
        let current_timestamp = clock.unix_timestamp;
        // 2) Derive the day (UTC-based) from the timestamp (days since 1970-01-01)
        let current_day = (current_timestamp / 86400) as u64;

        let user_check_in_account = &mut ctx.accounts.user_check_in;
        let authority_pubkey = ctx.accounts.authority.key();

        // If the account is newly created, set its authority to the signer's public key
        if user_check_in_account.authority == Pubkey::default() {
            user_check_in_account.authority = authority_pubkey;
        }

        // If the user has already checked in today, throw an error
        if user_check_in_account.last_check_in_day == current_day {
            return err!(DailyCheckInError::AlreadyCheckedInToday);
        }

        // Otherwise, update the last_check_in_day and emit the event
        user_check_in_account.last_check_in_day = current_day;
        emit!(CheckInEvent {
            authority: authority_pubkey,
            check_in_day: current_day,
        });

        Ok(())
    }
}

/// The context for the `check_in` instruction.
#[derive(Accounts)]
pub struct CheckIn<'info> {
    /// PDA storing the user's check-in status, created if it does not exist.
    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + 32 + 8, // account discriminator + authority pubkey + last_check_in_day (u64)
        seeds = [b"user-check-in", authority.key().as_ref()],
        bump
    )]
    pub user_check_in: Account<'info, UserCheckInState>,

    /// The user calling the instruction (payer for creation).
    #[account(mut)]
    pub authority: Signer<'info>,

    /// System program required for creating the PDA if needed.
    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,
}

/// State struct to store check-in data for each user.
/// Stored in the `user_check_in` PDA.
#[account]
pub struct UserCheckInState {
    /// The authority (user) who owns this check-in account.
    pub authority: Pubkey,
    /// The last UTC day the user checked in (days since 1970-01-01).
    pub last_check_in_day: u64,
}

/// Event emitted each time a user checks in successfully.
#[event]
pub struct CheckInEvent {
    pub authority: Pubkey,
    pub check_in_day: u64,
}

/// Custom error definitions for the Daily Check-In program.
#[error_code]
pub enum DailyCheckInError {
    #[msg("You have already checked in today.")]
    AlreadyCheckedInToday,
}
