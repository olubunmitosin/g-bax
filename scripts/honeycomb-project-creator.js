#!/usr/bin/env node

/**
 * JavaScript wrapper for createProject function from honeycombHelpers.ts
 * This creates a project with profile tree and badging criteria
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import * as web3 from "@solana/web3.js";
import {
  BadgesCondition,
  createEdgeClient,
} from "@honeycomb-protocol/edge-client";
import {
  sendTransactionForTests as sendTransactionT,
} from "@honeycomb-protocol/edge-client/client/helpers.js";
import base58 from "bs58";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_URL = process.env.NEXT_PUBLIC_HONEYCOMB_EDGE_API_URL ?? "https://edge.test.honeycombprotocol.com/";
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://rpc.test.honeycombprotocol.com/";

const connection = new web3.Connection(RPC_URL, {
  commitment: "processed",
  wsEndpoint: process.env.RPC_WS_URL || RPC_URL,
});

const client = createEdgeClient(API_URL, false);
const sseClient = createEdgeClient(API_URL, true);

// Load admin keypair (async)
const loadAdminKeypair = async () => {
  try {
    const fs = await import('fs');

    const possiblePaths = [
      path.resolve(process.cwd(), "keys", "admin.json"),
      path.resolve(__dirname, "../keys", "admin.json"),
    ];

    for (const adminPath of possiblePaths) {
      if (fs.existsSync(adminPath)) {
        const adminKeyData = JSON.parse(fs.readFileSync(adminPath, "utf8"));
        return web3.Keypair.fromSecretKey(Uint8Array.from(adminKeyData));
      }
    }

    throw new Error("admin.json not found");
  } catch (error) {
    console.error("Failed to load admin keypair:", error.message);
    throw error;
  }
};

// Send transaction helper
const sendTransaction = async (
  txResponse,
  signers,
  action = "",
  logOnSuccess = false,
) => {
  const response = await sendTransactionT(
    sseClient,
    {
      transaction: txResponse.transaction,
      blockhash: txResponse.blockhash,
      lastValidBlockHeight: txResponse.lastValidBlockHeight,
    },
    signers,
    {
      skipPreflight: true,
      commitment: "finalized",
    },
  );

  if (logOnSuccess || response.status !== "Success") {
    console.log(action, response.status, response.signature, response.error);
  }

  return response;
};

// Main createProject function (JavaScript version)
export async function createProject(
  name = "G-Bax Space Exploration Game",
  authority,
  payer,
  subsidizeFees = true,
  createProfilesTree = true,
  createBadgingCriteria = true,
) {
  console.log('Creating Honeycomb project...');

  // Load admin keypair
  const adminKeypair = await loadAdminKeypair();

  // Use provided authority/payer or default to admin keypair
  const finalAuthority = authority || adminKeypair.publicKey.toString();
  const finalPayer = payer || adminKeypair.publicKey.toString();
  
  // Step 1: Create the project
  const {
    createCreateProjectTransaction: { project: projectAddress, tx: txResponse },
  } = await client.createCreateProjectTransaction({
    name,
    authority: finalAuthority,
    payer: finalPayer,
    subsidizeFees,
  });

  console.log(`Project Address: ${projectAddress}`);
  console.log('Sending project creation transaction...');

  await sendTransaction(
    txResponse,
    [adminKeypair],
    "createCreateProjectTransaction",
  );

  let project = await client
    .findProjects({ addresses: [projectAddress] })
    .then((res) => res.project[0]);

  console.log('✅ Project created successfully');

  // Step 2: Fund project for subsidy if needed
  if (subsidizeFees) {
    console.log('Funding project for fee subsidy...');
    
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    const versionedTx = new web3.VersionedTransaction(
      new web3.TransactionMessage({
        instructions: [
          web3.SystemProgram.transfer({
            fromPubkey: adminKeypair.publicKey,
            toPubkey: new web3.PublicKey(projectAddress),
            lamports: 1_000_000_000, // 1 SOL
          }),
        ],
        payerKey: adminKeypair.publicKey,
        recentBlockhash: blockhash,
      }).compileToV0Message([]),
    );

    versionedTx.sign([adminKeypair]);
    await sendTransaction(
      {
        transaction: base58.encode(versionedTx.serialize()),
        blockhash,
        lastValidBlockHeight,
      },
      [adminKeypair],
      "fundProjectForSubsidy",
    );

    console.log('✅ Project funded for fee subsidy');
  }

  // Step 3: Create a profile tree
  if (createProfilesTree) {
    console.log('Creating profiles tree...');

    const {
      createCreateProfilesTreeTransaction: { tx: txResponse, treeAddress },
    } = await client.createCreateProfilesTreeTransaction({
      treeConfig: {
        advanced: {
          maxDepth: 3,
          maxBufferSize: 8,
          canopyDepth: 3,
        },
      },
      project: project.address,
      payer: adminKeypair.publicKey.toString(),
    });

    console.log(`Profile Tree Address (from transaction): ${treeAddress}`);

    await sendTransaction(
      txResponse,
      [adminKeypair],
      "createCreateProfilesTreeTransaction",
    );

    // Update a project object with the tree address
    project.profilesTreeAddress = treeAddress;

    // Also fetch an updated project from blockchain to confirm
    const updatedProject = await client
      .findProjects({
        addresses: [project.address],
      })
      .then(({ project: [project] }) => project);

    // Use the tree address from transaction response if a blockchain query doesn't have it yet
    if (!updatedProject.profilesTreeAddress && treeAddress) {
      updatedProject.profilesTreeAddress = treeAddress;
    }

    // Ensure the tree address is preserved in the final project object
    project = {
      ...updatedProject,
      profilesTreeAddress: treeAddress // Force the tree address to be included
    };

    console.log('✅ Profiles tree created successfully');
    console.log(`Tree Address: ${project.profilesTreeAddress || treeAddress}`);
  }

  // Step 4: Create badging criteria
  if (createBadgingCriteria) {
    console.log('🏷️  Creating badging criteria...');
    
    const { createInitializeBadgeCriteriaTransaction: txResponse } =
      await client.createInitializeBadgeCriteriaTransaction({
        args: {
          authority: adminKeypair.publicKey.toString(),
          projectAddress,
          endTime: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 1 week
          startTime: Math.floor(Date.now() / 1000),
          badgeIndex: 0,
          payer: adminKeypair.publicKey.toString(),
          condition: BadgesCondition.Public,
        },
      });

    await sendTransaction(
      txResponse,
      [adminKeypair],
      "createInitializeBadgeCriteriaTransaction",
    );

    const updatedProjectAfterBadging = await client
      .findProjects({ addresses: [projectAddress] })
      .then((res) => res.project[0]);

    // Preserve the profile tree address from before
    project = {
      ...updatedProjectAfterBadging,
      profilesTreeAddress: project.profilesTreeAddress // Preserve the tree address
    };

    console.log('✅ Badging criteria created successfully');
  }

  // Final check to ensure profile tree address is included
  console.log(`🔍 Final project profilesTreeAddress: ${project.profilesTreeAddress}`);

  return project;
}

// Test function to run the project creation
export async function runProjectCreation() {
  try {
    console.log('HONEYCOMB PROJECT CREATION');
    console.log('='.repeat(50));

    // Load admin keypair
    const adminKeypair = await loadAdminKeypair();

    console.log(`Admin Public Key: ${adminKeypair.publicKey.toString()}`);
    console.log(`RPC URL: ${RPC_URL}`);
    console.log(`API URL: ${API_URL}`);
    console.log();

    const project = await createProject();

    console.log('\n PROJECT CREATION COMPLETE!');
    console.log('='.repeat(40));
    console.log(`Project Address: ${project.address}`);
    console.log(`Authority: ${project.authority}`);
    console.log(`Payer: ${project.payer}`);
    console.log(`Profile Tree: ${project.profilesTreeAddress || 'Not Created'}`);
    console.log(`Badge Criteria: ${project.badgeCriteria ? 'Created' : 'Not Created'}`);
    console.log(`Subsidized: ${project.subsidyFees ? 'Yes' : 'No'}`);

    return project;

  } catch (error) {
    console.error('\nPROJECT CREATION FAILED');
    console.error('Error:', error.message);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runProjectCreation().catch(console.error);
}
