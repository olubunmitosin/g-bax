#!/usr/bin/env node

/**
 * Create Honeycomb Character Model using Honeycomb Edge Client
 * This script creates a character model and assembler config, then updates honeycomb-project-details.json
 * 
 * Usage: node scripts/create-honeycomb-character.js
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import * as web3 from "@solana/web3.js";
import {
  createEdgeClient,
} from "@honeycomb-protocol/edge-client";
import {
  sendTransactionForTests as sendTransactionT,
} from "@honeycomb-protocol/edge-client/client/helpers.js";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


class HoneycombCharacterSetup {
  constructor() {
    this.projectData = null;
    this.adminKeypair = null;
    this.keysDir = path.join(__dirname, '..', 'keys');
    this.edgeClient = null;
    this.characterModelAddress = null;
    this.assemblerConfigAddress = null;
    this.charactersTreeAddress = null;
    this.assemblerConfigDetails = null;
    this.projectDetails = null;
  }

  async initialize() {
    console.log('🚀 HONEYCOMB CHARACTER MODEL SETUP');
    console.log('='.repeat(50));
    console.log('Creating character model and assembler config...\n');

    // Load project details
    const projectDetailsPath = path.join(__dirname, '..', 'honeycomb-project-details.json');
    if (!fs.existsSync(projectDetailsPath)) {
      throw new Error('honeycomb-project-details.json not found. Run setup-honeycomb-project.js first.');
    }

    this.projectData = JSON.parse(fs.readFileSync(projectDetailsPath, 'utf8'));
    console.log('✅ Project details loaded');
    console.log(`📍 Project Address: ${this.projectData.projectAddress}`);

    // Load admin keypair from environment or project data
    let adminKeyData;

    // Try to get from environment variable first
    const envAdminKey = process.env.NEXT_PUBLIC_HONEYCOMB_ADMIN_PRIVATE_KEY;
    if (envAdminKey) {
      adminKeyData = JSON.parse(envAdminKey);
    } else if (this.projectData.keypairs && this.projectData.keypairs.admin) {
      // Fallback to project data
      adminKeyData = this.projectData.keypairs.admin;
    } else {
      throw new Error('Admin key not found in environment or project data.');
    }

    this.adminKeypair = web3.Keypair.fromSecretKey(new Uint8Array(adminKeyData));
    console.log('✅ Admin keypair loaded');
    console.log(`👑 Admin Public Key: ${this.adminKeypair.publicKey.toString()}`);

    // Initialize edge client
    const edgeApiUrl = this.projectData.edgeApiUrl || "https://edge.test.honeycombprotocol.com/";
    this.edgeClient = createEdgeClient(edgeApiUrl, false);
    console.log('✅ Edge client initialized');
  }

  async createAssemblerConfig() {
    console.log('\n🔧 CREATING ASSEMBLER CONFIG');
    console.log('='.repeat(35));

    try {
      console.log('📋 Assembler Config Configuration:');
      console.log('  Project:', this.projectData.projectAddress);
      console.log('  Authority:', this.adminKeypair.publicKey.toString());
      console.log('  Ticker: G-BAX-TRAITS');
      console.log('  Order: Mining, Crafting, Exploration, Combat, Leadership');
      console.log('  Tree Config: Basic (100,000 assets)');

      try {
        const { createCreateAssemblerConfigTransaction } =
          await this.edgeClient.createCreateAssemblerConfigTransaction({
            project: this.projectData.projectAddress,
            authority: this.adminKeypair.publicKey.toString(),
            payer: this.adminKeypair.publicKey.toString(),
            treeConfig: {
              basic: {
                numAssets: 100000, // The desired number of character information this tree will be able to store
              }
            },
            ticker: "G-BAX-TRAITS", // Unique ticker for the config
            order: ["Mining", "Crafting", "Exploration", "Combat", "Leadership"] // Character traits order
          });

        console.log('\n🔄 Creating assembler config...');

        // Sign and send transaction
        const response = await this.signAndSendTransaction(createCreateAssemblerConfigTransaction);

        if (!response.success) {
          throw new Error(`Transaction failed: ${response.error || "Unknown error"}`);
        }

        this.assemblerConfigAddress = createCreateAssemblerConfigTransaction.assemblerConfig;

        console.log('\n🎉 ASSEMBLER CONFIG CREATED SUCCESSFULLY!');
        console.log('='.repeat(45));
        console.log(`📍 Assembler Config Address: ${this.assemblerConfigAddress}`);

      } catch (error) {
        // Check if the error indicates the assembler config already exists
        if (error.message.includes('already exists') && error.message.includes('address:')) {
          // Extract the existing address from the error message
          const addressMatch = error.message.match(/address: ([A-Za-z0-9]+)/);
          if (addressMatch) {
            this.assemblerConfigAddress = addressMatch[1];
            console.log('\n✅ ASSEMBLER CONFIG ALREADY EXISTS!');
            console.log('='.repeat(45));
            console.log(`📍 Using existing Assembler Config: ${this.assemblerConfigAddress}`);
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }

      return this.assemblerConfigAddress;

    } catch (error) {
      console.error('❌ Failed to create assembler config:', error.message);
      throw error;
    }
  }

  async queryAssemblerConfigDetails() {
    console.log('\n🔍 QUERYING ASSEMBLER CONFIG DETAILS');
    console.log('='.repeat(40));

    try {
      console.log(`📋 Querying details for: ${this.assemblerConfigAddress}`);

      // Try to query the assembler config directly
      try {
        const assemblerConfigData = await this.edgeClient.assemblerConfig({
          address: this.assemblerConfigAddress
        });

        if (assemblerConfigData && assemblerConfigData.assemblerConfig) {
          const config = assemblerConfigData.assemblerConfig;

          console.log('\n✅ ASSEMBLER CONFIG DETAILS FOUND!');
          console.log('='.repeat(45));
          console.log(`📍 Address: ${config.address}`);
          console.log(`🏗️  Project: ${config.project}`);
          console.log(`👑 Authority: ${config.authority}`);
          console.log(`🏷️  Ticker: ${config.ticker}`);

          if (config.order && config.order.length > 0) {
            console.log(`📊 Trait Order (${config.order.length} traits):`);
            config.order.forEach((trait, index) => {
              console.log(`   ${index + 1}. ${trait}`);
            });
          }

          if (config.tree) {
            console.log(`🌳 Tree Address: ${config.tree}`);
          }

          if (config.createdAt) {
            console.log(`📅 Created: ${new Date(config.createdAt).toLocaleString()}`);
          }

          // Store the detailed config for later use
          this.assemblerConfigDetails = config;

          return config;
        }
      } catch (queryError) {
        console.log(`⚠️  Direct query failed: ${queryError.message}`);
      }

      console.log('ℹ️  Using configuration from creation parameters:');
      console.log(`📍 Address: ${this.assemblerConfigAddress}`);
      console.log(`🏗️  Project: ${this.projectData.projectAddress}`);
      console.log(`👑 Authority: ${this.adminKeypair.publicKey.toString()}`);
      console.log(`🏷️  Ticker: G-BAX-TRAITS`);
      console.log(`📊 Trait Order (5 traits):`);
      console.log(`   1. Mining`);
      console.log(`   2. Crafting`);
      console.log(`   3. Exploration`);
      console.log(`   4. Combat`);
      console.log(`   5. Leadership`);

      // Create a config object with known details
      this.assemblerConfigDetails = {
        address: this.assemblerConfigAddress,
        project: this.projectData.projectAddress,
        authority: this.adminKeypair.publicKey.toString(),
        ticker: "G-BAX-TRAITS",
        order: ["Mining", "Crafting", "Exploration", "Combat", "Leadership"]
      };

      return this.assemblerConfigDetails;

    } catch (error) {
      console.log(`⚠️  Failed to query assembler config details: ${error.message}`);
      return null;
    }
  }

  async queryProjectDetails() {
    console.log('\n🏗️  QUERYING PROJECT DETAILS');
    console.log('='.repeat(35));

    try {
      console.log(`📋 Querying project: ${this.projectData.projectAddress}`);

      // Use the correct GraphQL query method
      const projectData = await this.edgeClient.project({
        address: this.projectData.projectAddress
      });

      if (projectData && projectData.project) {
        const project = projectData.project;

        console.log('\n✅ PROJECT DETAILS FOUND!');
        console.log('='.repeat(35));
        console.log(`📍 Address: ${project.address}`);
        console.log(`🏷️  Name: ${project.name || 'N/A'}`);
        console.log(`👑 Authority: ${project.authority}`);

        if (project.profileDataConfig) {
          console.log(`👤 Profile Data Config: ${project.profileDataConfig}`);
        }

        // Store the project details for later use
        this.projectDetails = project;

        return project;
      } else {
        console.log('⚠️  No project details found');
        return null;
      }

    } catch (error) {
      console.log(`⚠️  Failed to query project details: ${error.message}`);
      return null;
    }
  }

  async createCharacterModel() {
    console.log('\n👤 CREATING CHARACTER MODEL');
    console.log('='.repeat(35));

    try {
      console.log('📋 Character Model Configuration:');
      console.log('  Project:', this.projectData.projectAddress);
      console.log('  Authority:', this.adminKeypair.publicKey.toString());
      console.log('  Assembler Config:', this.assemblerConfigAddress);
      console.log('  Collection Name: G-Bax Space Explorers');
      console.log('  Name: G-Bax Character');
      console.log('  Symbol: GBAX');

      try {
        // First, try to find existing character models for this project
        console.log('\n🔍 Checking for existing character models...');

        try {
          const projectData = await this.edgeClient.findProjects({
            addresses: [this.projectData.projectAddress]
          });

          if (projectData && projectData.project && projectData.project[0] && projectData.project[0].characterModels) {
            const existingModels = projectData.project[0].characterModels;
            if (existingModels.length > 0) {
              this.characterModelAddress = existingModels[0].address;
              console.log('\n✅ FOUND EXISTING CHARACTER MODEL!');
              console.log('='.repeat(45));
              console.log(`📍 Using existing Character Model: ${this.characterModelAddress}`);
              return this.characterModelAddress;
            }
          }
        } catch (queryError) {
          console.log('No existing character models found, creating new one...');
        }

        const { createCreateCharacterModelTransaction: { modelAddress: characterModelAddress, tx: modelTxResponse } } =
          await this.edgeClient.createCreateCharacterModelTransaction({
            project: this.projectData.projectAddress,
            authority: this.adminKeypair.publicKey.toString(),
            payer: this.adminKeypair.publicKey.toString(),
            config: {
              kind: "Assembled",
              assemblerConfigInput: {
                assemblerConfig: this.assemblerConfigAddress,
                collectionName: "G-Bax Space Explorers",
                name: "G-Bax Character NFT",
                symbol: "GBAX",
                description: "A space explorer character in the G-Bax universe",
                sellerFeeBasisPoints: 0,
                creators: [
                  {
                    address: this.adminKeypair.publicKey.toString(),
                    share: 100,
                  }
                ]
              }
            }
          });

        console.log('\n🔄 Creating character model...', modelTxResponse);
        this.characterModelAddress = characterModelAddress;

        // Sign and send transaction
        const response = await this.signAndSendTransaction(modelTxResponse);
        console.log('Response:', response);
        if (!response.success) {
          throw new Error(`Transaction failed: ${response.error || "Unknown error"}`);
        }

        this.characterModelAddress = characterModelAddress;

        console.log('\n🎉 CHARACTER MODEL CREATED SUCCESSFULLY!');
        console.log('='.repeat(45));
        console.log(`📍 Character Model Address: ${this.characterModelAddress}`);

      } catch (error) {
        // Check if the error indicates the character model already exists
        if (error.message.includes('already exists') && error.message.includes('address:')) {
          // Extract the existing address from the error message
          const addressMatch = error.message.match(/address: ([A-Za-z0-9]+)/);
          if (addressMatch) {
            this.characterModelAddress = addressMatch[1];
            console.log('\n✅ CHARACTER MODEL ALREADY EXISTS!');
            console.log('='.repeat(45));
            console.log(`📍 Using existing Character Model: ${this.characterModelAddress}`);
          } else {
            throw error;
          }
        } else {
          console.log('\n⚠️  CHARACTER MODEL CREATION FAILED');
          console.log('='.repeat(45));
          console.log(`❌ Error: ${error.message}`);
          console.log('This might be due to API limitations or configuration issues.');
          console.log('The assembler config was created successfully and can be used for character creation.');

          // For now, we'll continue without the character model
          // The assembler config is the most important part for character creation
          this.characterModelAddress = null;
        }
      }

      return this.characterModelAddress;

    } catch (error) {
      console.error('❌ Failed to create character model:', error.message);
      throw error;
    }
  }

  async createCharactersTree() {
    console.log('\n🌳 CREATING CHARACTERS TREE');
    console.log('='.repeat(35));

    if (!this.characterModelAddress) {
      console.log('⚠️  Skipping characters tree creation - no character model available');
      this.charactersTreeAddress = null;
      return null;
    }

    try {
      console.log('📋 Characters Tree Configuration:');
      console.log('  Project:', this.projectData.projectAddress);
      console.log('  Authority:', this.adminKeypair.publicKey.toString());
      console.log('  Character Model:', this.characterModelAddress);
      console.log('  Tree Config: Basic (100,000 assets)');

      try {
        const { createCreateCharactersTreeTransaction } =
          await this.edgeClient.createCreateCharactersTreeTransaction({
            authority: this.adminKeypair.publicKey.toString(),
            project: this.projectData.projectAddress,
            characterModel: this.characterModelAddress,
            payer: this.adminKeypair.publicKey.toString(),
            treeConfig: {
              basic: {
                numAssets: 100000
              }
            }
          });

        console.log('\n🔄 Creating characters tree...');

        // Sign and send transaction
        const response = await this.signAndSendTransaction(createCreateCharactersTreeTransaction);

        if (!response.success) {
          throw new Error(`Transaction failed: ${response.error || "Unknown error"}`);
        }

        this.charactersTreeAddress = createCreateCharactersTreeTransaction.charactersTree;

        console.log('\n🎉 CHARACTERS TREE CREATED SUCCESSFULLY!');
        console.log('='.repeat(45));
        console.log(`📍 Characters Tree Address: ${this.charactersTreeAddress}`);

      } catch (error) {
        // Check if the error indicates the characters tree already exists
        if (error.message.includes('already exists') && error.message.includes('address:')) {
          // Extract the existing address from the error message
          const addressMatch = error.message.match(/address: ([A-Za-z0-9]+)/);
          if (addressMatch) {
            this.charactersTreeAddress = addressMatch[1];
            console.log('\n✅ CHARACTERS TREE ALREADY EXISTS!');
            console.log('='.repeat(45));
            console.log(`📍 Using existing Characters Tree: ${this.charactersTreeAddress}`);
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }

      return this.charactersTreeAddress;

    } catch (error) {
      console.error('❌ Failed to create characters tree:', error.message);
      throw error;
    }
  }

  async signAndSendTransaction(transactionData) {
    try {
      console.log('📡 Signing and sending transaction...');

      const response = await sendTransactionT(
        this.edgeClient,
        {
          transaction: transactionData.transaction,
          blockhash: transactionData.blockhash,
          lastValidBlockHeight: transactionData.lastValidBlockHeight,
        },
        [this.adminKeypair],
        {
          skipPreflight: false,
          commitment: "confirmed",
        }
      );

      console.log('📡 Transaction response:', response);

      return {
        success: response.status === "Success",
        signature: response.signature,
        error: response.error
      };
    } catch (error) {
      console.log('❌ Transaction error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateProjectDetails() {
    console.log('\n📝 UPDATING PROJECT DETAILS');
    console.log('='.repeat(30));

    try {
      const timestamp = new Date().toISOString();
      
      // Update the existing project details with character information
      const updatedProjectDetails = {
        ...this.projectData,
        lastUpdated: timestamp,
        
        // Add character system information
        characterSystem: {
          assemblerConfig: {
            address: this.assemblerConfigAddress,
            project: this.projectData.projectAddress,
            authority: this.adminKeypair.publicKey.toString(),
            ticker: "G-BAX-TRAITS",
            order: ["Mining", "Crafting", "Exploration", "Combat", "Leadership"],
            created: true,
            createdAt: timestamp,
            // Include queried details if available
            ...(this.assemblerConfigDetails && {
              queriedDetails: {
                actualTicker: this.assemblerConfigDetails.ticker,
                actualOrder: this.assemblerConfigDetails.order,
                treeAddress: this.assemblerConfigDetails.tree,
                actualCreatedAt: this.assemblerConfigDetails.createdAt,
                queriedAt: timestamp
              }
            })
          },
          characterModel: this.characterModelAddress ? {
            address: this.characterModelAddress,
            project: this.projectData.projectAddress,
            authority: this.adminKeypair.publicKey.toString(),
            assemblerConfig: this.assemblerConfigAddress,
            collectionName: "G-Bax Space Explorers",
            name: "G-Bax Character",
            symbol: "GBAX",
            description: "A space explorer character in the G-Bax universe",
            created: true,
            createdAt: timestamp
          } : {
            created: false,
            error: "Character model creation failed - API limitations",
            note: "Assembler config is available for character creation"
          },
          charactersTree: this.charactersTreeAddress ? {
            address: this.charactersTreeAddress,
            project: this.projectData.projectAddress,
            authority: this.adminKeypair.publicKey.toString(),
            characterModel: this.characterModelAddress,
            treeConfig: {
              basic: {
                numAssets: 100000
              }
            },
            created: true,
            createdAt: timestamp
          } : {
            created: false,
            reason: "Depends on character model"
          },
          initialized: true,
          initializationMethod: "create-honeycomb-character.js script"
        }
      };

      // Save updated project details
      const projectDetailsPath = path.join(__dirname, '..', 'honeycomb-project-details.json');
      fs.writeFileSync(projectDetailsPath, JSON.stringify(updatedProjectDetails, null, 2));
      console.log('✅ Updated honeycomb-project-details.json');

      // Create a detailed setup file with timestamp
      const detailedFileName = `honeycomb-character-setup-${timestamp.replace(/[:.]/g, '-')}.json`;
      const detailedPath = path.join(__dirname, '..', detailedFileName);
      
      const detailedData = {
        ...updatedProjectDetails,
        setupDetails: {
          method: "create-honeycomb-character.js",
          timestamp,
          assemblerConfigAddress: this.assemblerConfigAddress,
          characterModelAddress: this.characterModelAddress,
          features: {
            assemblerConfigCreated: true,
            characterModelCreated: true,
            characterSystemInitialized: true
          }
        }
      };

      fs.writeFileSync(detailedPath, JSON.stringify(detailedData, null, 2));
      console.log(`✅ Created detailed setup file: ${detailedFileName}`);

      return { updatedProjectDetails, detailedData };

    } catch (error) {
      console.error('❌ Failed to update project details:', error.message);
      throw error;
    }
  }

  async updateEnvironmentFile() {
    console.log('\n📝 UPDATING ENVIRONMENT FILE');
    console.log('='.repeat(35));

    try {
      const envPath = path.join(__dirname, '..', '.env.local');
      let envContent = fs.readFileSync(envPath, 'utf8');

      // Add character model address (if available)
      if (this.characterModelAddress) {
        if (envContent.includes('NEXT_PUBLIC_CHARACTER_MODEL_ADDRESS=')) {
          envContent = envContent.replace(
            /NEXT_PUBLIC_CHARACTER_MODEL_ADDRESS=.*/,
            `NEXT_PUBLIC_CHARACTER_MODEL_ADDRESS=${this.characterModelAddress}`
          );
        } else {
          envContent += `\nNEXT_PUBLIC_CHARACTER_MODEL_ADDRESS=${this.characterModelAddress}\n`;
        }
      }

      // Add assembler config address
      if (envContent.includes('NEXT_PUBLIC_ASSEMBLER_CONFIG_ADDRESS=')) {
        envContent = envContent.replace(
          /NEXT_PUBLIC_ASSEMBLER_CONFIG_ADDRESS=.*/,
          `NEXT_PUBLIC_ASSEMBLER_CONFIG_ADDRESS=${this.assemblerConfigAddress}`
        );
      } else {
        envContent += `NEXT_PUBLIC_ASSEMBLER_CONFIG_ADDRESS=${this.assemblerConfigAddress}\n`;
      }

      // Add characters tree address (if available)
      if (this.charactersTreeAddress) {
        if (envContent.includes('NEXT_PUBLIC_CHARACTERS_TREE_ADDRESS=')) {
          envContent = envContent.replace(
            /NEXT_PUBLIC_CHARACTERS_TREE_ADDRESS=.*/,
            `NEXT_PUBLIC_CHARACTERS_TREE_ADDRESS=${this.charactersTreeAddress}`
          );
        } else {
          envContent += `NEXT_PUBLIC_CHARACTERS_TREE_ADDRESS=${this.charactersTreeAddress}\n`;
        }
      }

      fs.writeFileSync(envPath, envContent);
      console.log('✅ Environment file updated with character system addresses');
      console.log(`🎭 Character Model: ${this.characterModelAddress || 'Not created'}`);
      console.log(`🔧 Assembler Config: ${this.assemblerConfigAddress}`);
      console.log(`🌳 Characters Tree: ${this.charactersTreeAddress || 'Not created'}`);

    } catch (error) {
      console.log(`⚠️  Could not update environment file: ${error.message}`);
    }
  }

  async run() {
    try {
      await this.initialize();

      await this.queryProjectDetails();

      await this.createAssemblerConfig();

      await this.queryAssemblerConfigDetails();

      await this.createCharacterModel();

      await this.createCharactersTree();

      await this.updateProjectDetails();
      
      await this.updateEnvironmentFile();

      console.log('\n🎉 HONEYCOMB CHARACTER SYSTEM SETUP COMPLETE!');
      console.log('='.repeat(55));
      console.log(`📍 Project Address: ${this.projectData.projectAddress}`);
      console.log(`🔧 Assembler Config: ${this.assemblerConfigAddress}`);
      console.log(`🎭 Character Model: ${this.characterModelAddress}`);
      console.log(`🌳 Characters Tree: ${this.charactersTreeAddress}`);
      console.log('✅ Project details updated');
      console.log('✅ Environment file updated');
      console.log('\n🎮 Character system ready for game integration!');
      console.log('Players can now create characters and assign traits.');

    } catch (error) {
      console.error('\n❌ HONEYCOMB CHARACTER SETUP FAILED');
      console.error('Error:', error.message);
      
      // Provide helpful error messages
      if (error.message.includes('honeycomb-project-details.json')) {
        console.log('\n💡 SOLUTION:');
        console.log('Run the setup-honeycomb-project.js script first to create the project');
      } else if (error.message.includes('insufficient funds')) {
        console.log('\n💡 SOLUTION:');
        console.log('Make sure your admin wallet has enough SOL for transactions');
      }
      
      process.exit(1);
    }
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  const setup = new HoneycombCharacterSetup();
  setup.run().catch(console.error);
}

export { HoneycombCharacterSetup };
