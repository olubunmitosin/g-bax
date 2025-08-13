import path from "path";

import * as web3 from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import {
  BadgesCondition,
  createEdgeClient,
  Transaction,
  Transactions,
} from "@honeycomb-protocol/edge-client";
import {
  sendTransactionForTests as sendTransactionT,
  sendTransactionsForTests as sendTransactionsT,
} from "@honeycomb-protocol/edge-client/client/helpers";
import base58 from "bs58";

export const API_URL =
  process.env.NEXT_PUBLIC_HONEYCOMB_EDGE_API_URL ??
  "https://edge.test.honeycombprotocol.com/";
export const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
  "https://rpc.test.honeycombprotocol.com/";
export const DAS_API_URL = process.env.DAS_API_URL ?? RPC_URL;

export const connection = new web3.Connection(RPC_URL, {
  commitment: "processed",
  wsEndpoint: process.env.RPC_WS_URL || RPC_URL,
});

export const client = createEdgeClient(API_URL, false);
export const log = process.env.DEBUG_LOGS == "true" ? console.log : () => {};
export const errorLog =
  process.env.ERROR_LOGS == "true" ? console.error : () => {};
export const dirLog = process.env.DEBUG_LOGS == "true" ? console.dir : () => {};

export const sseClient = createEdgeClient(API_URL, true);
// Load admin keypair with better path resolution (server-side only)
// const getAdminKeypair = async () => {
//   // Only run on server-side (Node.js environment)
//   if (typeof window !== "undefined") {
//     throw new Error("Admin keypair can only be loaded on server-side");
//   }
//
//   try {
//     // Dynamic import of fs module (only available on server-side)
//     const fs = await import("fs");
//
//     // Try different possible paths for the admin.json file
//     const possiblePaths = [
//       path.resolve(process.cwd(), "keys", "admin.json"),
//       path.resolve(process.cwd(), "../keys", "admin.json"),
//       path.resolve(process.cwd(), "../../keys", "admin.json"),
//     ];
//
//     for (const adminPath of possiblePaths) {
//       if (fs.existsSync(adminPath)) {
//         const adminKeyData = JSON.parse(fs.readFileSync(adminPath, "utf8"));
//
//         return web3.Keypair.fromSecretKey(Uint8Array.from(adminKeyData));
//       }
//     }
//
//     throw new Error("admin.json not found in any expected location");
//   } catch (error: any) {
//     console.error("Failed to load admin keypair:", error.message);
//     throw error;
//   }
// };

// Export the admin keypair loading function
// export { getAdminKeypair };

// For backward compatibility, create a lazy-loaded admin keypair
let _adminKeypair: web3.Keypair | null = null;

// export const adminKeypair = {
//   get publicKey() {
//     if (!_adminKeypair) {
//       throw new Error(
//         "Admin keypair not loaded. Call getAdminKeypair() first.",
//       );
//     }
//
//     return _adminKeypair.publicKey;
//   },
//   get secretKey() {
//     if (!_adminKeypair) {
//       throw new Error(
//         "Admin keypair not loaded. Call getAdminKeypair() first.",
//       );
//     }
//
//     return _adminKeypair.secretKey;
//   },
//   async load() {
//     if (!_adminKeypair) {
//       _adminKeypair = await getAdminKeypair();
//     }
//
//     return _adminKeypair;
//   },
// };

export const sendTransaction = async (
  txResponse: Transaction,
  signers: web3.Keypair[],
  action?: string,
  logOnSuccess = false,
) => {
  const response = await sendTransactionT(
    sseClient,
    {
      transaction: txResponse.transaction,
      blockhash: txResponse!.blockhash,
      lastValidBlockHeight: txResponse!.lastValidBlockHeight,
    },
    signers,
    {
      skipPreflight: true,
      commitment: "finalized",
    },
  );

  if (logOnSuccess || response.status !== "Success") {
    errorLog(action, response.status, response.signature, response.error);
  }

  return response;
};

export const sendTransactions = async (
  txResponse: Transactions,
  signer: web3.Keypair[],
  action: string,
) => {
  return await sendTransactionsT(
    sseClient,
    txResponse,
    signer,
    {
      skipPreflight: true,
      commitment: "processed",
    },
    (response) => {
      if (response.status !== "Success") {
        errorLog(action, response.signature, response.error);
      }
    },
  );
};

export async function createProject(
  name = "G-Bax Space Exploration Game",
  authority?: string,
  payer?: string,
  subsidizeFees = true,
  createProfilesTree = true,
  createBadgingCriteria = true,
) {
  // Load admin keypair first
  // const loadedAdminKeypair = await getAdminKeypair();
  const loadedAdminKeypair: any = {};

  // Use provided authority/payer or default to admin keypair
  const finalAuthority = authority || loadedAdminKeypair.publicKey.toString();
  const finalPayer = payer || loadedAdminKeypair.publicKey.toString();
  const {
    createCreateProjectTransaction: { project: projectAddress, tx: txResponse },
  } = await client.createCreateProjectTransaction({
    name,
    authority: finalAuthority,
    payer: finalPayer,
    subsidizeFees,
  });

  await sendTransaction(
    txResponse,
    [loadedAdminKeypair],
    "createCreateProjectTransaction",
  );
  let project = await client
    .findProjects({ addresses: [projectAddress] })
    .then((res) => res.project[0]);

  if (subsidizeFees) {
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    const versionedTx = new web3.VersionedTransaction(
      new web3.TransactionMessage({
        instructions: [
          web3.SystemProgram.transfer({
            fromPubkey: loadedAdminKeypair.publicKey,
            toPubkey: new web3.PublicKey(projectAddress),
            lamports: 1_000_000_000,
          }),
        ],
        payerKey: loadedAdminKeypair.publicKey,
        recentBlockhash: blockhash,
      }).compileToV0Message([]),
    );

    versionedTx.sign([loadedAdminKeypair]);
    await sendTransaction(
      {
        transaction: base58.encode(versionedTx.serialize()),
        blockhash,
        lastValidBlockHeight,
      },
      [loadedAdminKeypair],
      "fundProjectForSubsidy",
    );
  }

  if (createProfilesTree) {
    const {
      createCreateProfilesTreeTransaction: { tx: txResponse },
    } = await client.createCreateProfilesTreeTransaction({
      treeConfig: {
        advanced: {
          maxDepth: 3,
          maxBufferSize: 8,
          canopyDepth: 3,
        },
      },
      project: project.address,
      payer: loadedAdminKeypair.publicKey.toString(),
    });

    await sendTransaction(
      txResponse,
      [loadedAdminKeypair],
      "createCreateProfilesTreeTransaction",
    );

    project = await client
      .findProjects({
        addresses: [project.address],
      })
      .then(({ project: [project] }) => project);
  }

  if (createBadgingCriteria) {
    const { createInitializeBadgeCriteriaTransaction: txResponse } =
      await client.createInitializeBadgeCriteriaTransaction({
        args: {
          authority: loadedAdminKeypair.publicKey.toString(),
          projectAddress,
          endTime: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
          startTime: Math.floor(Date.now() / 1000),
          badgeIndex: 0,
          payer: loadedAdminKeypair.publicKey.toString(),
          condition: BadgesCondition.Public,
        },
      });

    await sendTransaction(
      txResponse,
      [loadedAdminKeypair],
      "createInitializeBadgeCriteriaTransaction",
    );

    project = await client
      .findProjects({ addresses: [projectAddress] })
      .then((res) => res.project[0]);
  }

  return project;
}

/**
 * Server-only helper function to create a profile tree for Honeycomb protocol
 * This should be called before creating user profiles
 * Helper function to check if user exists on Honeycomb protocol
 */
export async function checkUserExists(
  edgeClient: any,
  projectAddress: string,
  wallet: PublicKey,
): Promise<{ exists: boolean; user: any; profile: any }> {
  if (!edgeClient || !projectAddress) {
    return { exists: false, user: null, profile: null };
  }

  try {
    const users = await edgeClient.findUsers({
      wallets: [wallet],
      includeProjectProfiles: [projectAddress],
    });

    const user = users.user && users.user.length > 0 ? users.user[0] : null;
    const profile = user?.profiles?.[0] || null;

    return {
      exists: !!user,
      user,
      profile,
    };
  } catch (error) {
    console.error("Failed to check user existence:", error);

    return { exists: false, user: null, profile: null };
  }
}

/**
 * Helper function to get user bearer token for authentication
 */
async function getUserBearerToken(
  edgeClient: any,
  wallet: PublicKey,
  contextWallet: WalletContextState,
): Promise<string> {
  try {
    // Request authentication challenge
    const authInitOptions = {
      wallet: wallet.toBase58(),
    };

    const authInitResp = await edgeClient.authInit(authInitOptions);
    const authMessage = authInitResp.authInit.authMessage;

    // Sign the authentication message
    const encodedMessage = new TextEncoder().encode(authMessage);
    const signedMessage = await contextWallet.signMessage!(encodedMessage);

    // Confirm authentication
    const authConfirmOptions = {
      wallet: wallet.toBase58(),
      signedMessage: Array.from(signedMessage),
    };

    const confirmResp = await edgeClient.authConfirm(authConfirmOptions);

    return confirmResp.authConfirm.accessToken;
  } catch (error) {
    console.error("Failed to generate auth token:", error);
    throw new Error(
      `Authentication failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
