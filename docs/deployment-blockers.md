# Deployment Blockers (Phase 14)

Date: 2026-05-04

Phase 14 cannot be completed in-repo without deployment credentials and target environment access.

## Required external inputs
- Sepolia deployer wallet key with test ETH (`VALIDATOR_PRIVATE_KEY` and deployer account funding).
- Sepolia RPC endpoint for deployment execution.
- Vercel project access for web deployment.
- Supabase project credentials for production-like environment binding.

## Required completion evidence
- Contract address on Sepolia.
- Etherscan URL for deployed contract.
- Live web app URL.
- Updated README entries for both URLs.

## Current status
- Code and build artifacts are deployment-ready for the current repository state.
- Deployment execution and proof publication are blocked on external credentials/access.
