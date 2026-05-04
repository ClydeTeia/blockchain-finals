/**
 * Script to batch-approve all off-chain KYC-approved wallets on the on-chain contract.
 * Run this with: node approveAllVerified.js
 * 
 * This reads all approved KYC requests from Supabase and calls approveVerification()
 * on the smart contract for each wallet that isn't already verified on-chain.
 */

const { Pool } = require("pg");
const { Contract, JsonRpcProvider, Wallet, getAddress } = require("ethers");

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres.eeoxkrgniqfaxijumlix:uH5hkNK1WA3tVPTr@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require&uselibpqcompat=true";
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/f5ca5a80a165468eab1ee68a76d3d50d";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0xd44964682B6a86C02a9743A67f37388Fa2303CD3";
const VERIFIER_KEY = process.env.VERIFIER_PRIVATE_KEY || process.env.VALIDATOR_PRIVATE_KEY || "0x0ea29768f2ba6cc72101c3793147424b06feaece88685c9a52f74750d727cbf6";

async function main() {
  console.log("=== Batch On-Chain Verification Sync ===\n");

  // 1. Get all approved KYC wallets from database
  const pool = new Pool({ connectionString: DATABASE_URL });
  const { rows } = await pool.query(
    `SELECT DISTINCT wallet_address FROM kyc_requests WHERE status = 'approved'`
  );
  console.log(`Found ${rows.length} approved KYC wallet(s) in database.\n`);

  if (rows.length === 0) {
    console.log("No approved wallets found. Also checking survey_answers for respondent wallets...");
    const answerRows = await pool.query(
      `SELECT DISTINCT respondent_wallet FROM survey_answers WHERE status IN ('pending_onchain', 'completed_onchain', 'claimed')`
    );
    console.log(`Found ${answerRows.rows.length} wallet(s) with survey answers.\n`);
    for (const row of answerRows.rows) {
      rows.push({ wallet_address: row.respondent_wallet });
    }
  }

  await pool.end();

  if (rows.length === 0) {
    console.log("No wallets to approve.");
    return;
  }

  // 2. Connect to contract
  const provider = new JsonRpcProvider(SEPOLIA_RPC_URL);
  const signer = new Wallet(VERIFIER_KEY, provider);
  console.log("Verifier address:", signer.address);

  const readContract = new Contract(
    CONTRACT_ADDRESS,
    ["function isVerified(address wallet) view returns (bool)"],
    provider
  );
  const writeContract = new Contract(
    CONTRACT_ADDRESS,
    ["function approveVerification(address wallet)"],
    signer
  );

  // 3. Approve each wallet that isn't already verified
  let approved = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const wallet = getAddress(row.wallet_address);
    try {
      const isVerified = await readContract.isVerified(wallet);
      if (isVerified) {
        console.log(`  ✅ ${wallet} - already verified on-chain, skipping`);
        skipped++;
        continue;
      }

      console.log(`  🔄 ${wallet} - approving on-chain...`);
      const tx = await writeContract.approveVerification(wallet);
      console.log(`     tx: ${tx.hash}`);
      await tx.wait();
      console.log(`     ✅ confirmed!`);
      approved++;
    } catch (error) {
      console.error(`  ❌ ${wallet} - failed: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Approved: ${approved}`);
  console.log(`Skipped (already verified): ${skipped}`);
  console.log(`Failed: ${failed}`);
}

main().catch(console.error);
