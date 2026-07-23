/**
 * Example: Complete campaign lifecycle flow
 * Demonstrates creating, funding, and managing a campaign
 */

import { ProductionEscrowClient, AmountFormatter } from '../index';

// Initialize formatter for USDC (7 decimals)
const formatter = new AmountFormatter(7);

// Initialize client
const client = new ProductionEscrowClient({
  contractId: process.env.VITE_ESCROW_CONTRACT_ID || '',
  rpcUrl: 'https://soroban-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
});

// Mock signer (replace with actual Freighter integration)
const signer = async (xdr: string): Promise<string> => {
  // In production, this would call Freighter:
  // import { signTransaction } from '@stellar/freighter-api';
  // const result = await signTransaction(xdr, { networkPassphrase: '...' });
  // return result.signedTxXdr;
  return xdr;
};

/// step 1: Farmer creates a campaign
async function createCampaign() {
  console.log('Step 1: Creating campaign...');

  const targetAmount = formatter.fromDecimal('1000'); // 1000 USDC
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60); // 90 days

  const result = await client.createCampaign(
    {
      campaignId: 1n,
      farmer: 'GFARMER...', // Replace with actual farmer address
      targetAmount,
      tokenAddress: 'CUSDC...', // Replace with actual USDC token address
      deadline,
      harvestMetadata: 'tomatoes_2024',
    },
    signer,
  );

  if (result.success) {
    console.log(`✓ Campaign created! TX: ${result.txHash}`);
    return true;
  } else {
    console.error(`✗ Error: ${result.error?.message} (${result.error?.code})`);
    return false;
  }
}

/// Step 2: Investors fund the campaign
async function fundCampaign() {
  console.log('\nStep 2: Funding campaign...');

  const contributions = [
    { investor: 'GINVESTOR1...', amount: formatter.fromDecimal('300') },
    { investor: 'GINVESTOR2...', amount: formatter.fromDecimal('400') },
    { investor: 'GINVESTOR3...', amount: formatter.fromDecimal('300') },
  ];

  for (const contrib of contributions) {
    const result = await client.fundCampaign(
      {
        campaignId: 1n,
        investor: contrib.investor,
        amount: contrib.amount,
      },
      signer,
    );

    if (result.success) {
      console.log(
        `✓ ${contrib.investor.slice(0, 8)}... funded ${formatter.format(contrib.amount, 'USDC')}`,
      );
    } else {
      console.error(`✗ Funding failed: ${result.error?.message}`);
      return false;
    }
  }

  // Check campaign status
  const campaignResult = await client.getCampaign(1n);
  if (campaignResult.success && campaignResult.data) {
    const campaign = campaignResult.data;
    console.log(
      `\nCampaign funded: ${formatter.format(campaign.totalFunded, 'USDC')} / ${formatter.format(campaign.targetAmount, 'USDC')}`,
    );
    console.log(`Status: ${campaign.status}`);
  }

  return true;
}

/// Step 3: Admin configures tranches
async function configureTranches() {
  console.log('\nStep 3: Configuring tranches...');

  const tranches = [
    {
      amount: formatter.fromDecimal('300'),
      milestone: 'planting',
      released: false,
    },
    {
      amount: formatter.fromDecimal('400'),
      milestone: 'growing',
      released: false,
    },
    {
      amount: formatter.fromDecimal('300'),
      milestone: 'harvest',
      released: false,
    },
  ];

  const result = await client.configureTranches(
    {
      campaignId: 1n,
      tranches,
      admin: 'GADMIN...', // Replace with actual admin address
    },
    signer,
  );

  if (result.success) {
    console.log('✓ Tranches configured!');
    tranches.forEach((t, i) => {
      console.log(
        `  ${i + 1}. ${t.milestone}: ${formatter.format(t.amount, 'USDC')}`,
      );
    });
    return true;
  } else {
    console.error(`✗ Error: ${result.error?.message}`);
    return false;
  }
}

/// Step 4: Admin releases tranches as milestones complete
async function releaseTranches() {
  console.log('\nStep 4: Releasing tranches...');

  const releases = [
    { milestone: 'planting', amount: formatter.fromDecimal('300') },
    { milestone: 'growing', amount: formatter.fromDecimal('400') },
  ];

  for (const release of releases) {
    const result = await client.releaseTranche(
      {
        campaignId: 1n,
        recipient: 'GFARMER...', // Farmer address
        amount: release.amount,
        admin: 'GADMIN...',
      },
      signer,
    );

    if (result.success) {
      console.log(
        `✓ Released ${formatter.format(release.amount, 'USDC')} for ${release.milestone}`,
      );
    } else {
      console.error(`✗ Release failed: ${result.error?.message}`);
      return false;
    }
  }

  return true;
}

/// Step 5: Farmer reports harvest
async function reportHarvest() {
  console.log('\nStep 5: Reporting harvest...');

  const result = await client.reportHarvest(
    {
      campaignId: 1n,
      farmer: 'GFARMER...',
      outcome: 'success',
    },
    signer,
  );

  if (result.success) {
    console.log('✓ Harvest reported successfully!');
    return true;
  } else {
    console.error(`✗ Error: ${result.error?.message}`);
    return false;
  }
}

/// Step 6: Admin settles the campaign
async function settleCampaign() {
  console.log('\nStep 6: Settling campaign...');

  // Release final tranche to farmer
  const farmerPayout = formatter.fromDecimal('300');

  const result = await client.settleCampaign(
    {
      campaignId: 1n,
      farmer: 'GFARMER...',
      farmerPayout,
      admin: 'GADMIN...',
    },
    signer,
  );

  if (result.success) {
    console.log(
      `✓ Campaign settled! Final payout: ${formatter.format(farmerPayout, 'USDC')}`,
    );
    return true;
  } else {
    console.error(`✗ Error: ${result.error?.message}`);
    return false;
  }
}

/// Step 7: Investors claim returns (if any)
async function claimReturns() {
  console.log('\nStep 7: Investors claiming returns...');

  const investors = ['GINVESTOR1...', 'GINVESTOR2...', 'GINVESTOR3...'];

  for (const investor of investors) {
    // Check contribution first
    const contribResult = await client.getContribution(1n, investor);
    if (!contribResult.success || contribResult.data === 0n) {
      continue;
    }

    const result = await client.claimReturn(
      {
        campaignId: 1n,
        investor,
      },
      signer,
    );

    if (result.success) {
      console.log(`✓ ${investor.slice(0, 8)}... claimed returns`);
    } else {
      console.error(`✗ Claim failed: ${result.error?.message}`);
    }
  }

  return true;
}

/// Run the complete flow
export async function runCampaignFlow() {
  console.log('=== Campaign Lifecycle Flow ===\n');

  try {
    if (!(await createCampaign())) return;
    if (!(await fundCampaign())) return;
    if (!(await configureTranches())) return;
    if (!(await releaseTranches())) return;
    if (!(await reportHarvest())) return;
    if (!(await settleCampaign())) return;
    await claimReturns();

    console.log('\n=== Flow completed successfully! ===');
  } catch (error) {
    console.error('\n=== Flow failed with error ===');
    console.error(error);
  }
}
