#!/usr/bin/env node

/**
 * Setup Honeycomb Project using createProject from honeycombHelpers.ts
 * This script creates a project and profile tree, then saves all details to JSON files
 * 
 * Usage: node scripts/setup-honeycomb-project.js
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import * as web3 from "@solana/web3.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class HoneycombProjectSetup {
  constructor() {
    this.projectData = null;
    this.adminKeypair = null;
    this.keysDir = path.join(__dirname, '..', 'keys');
  }

  async initialize() {
    console.log('🚀 HONEYCOMB PROJECT SETUP');
    console.log('='.repeat(50));
    console.log('Using createProject from honeycombHelpers.ts');
    console.log('Creating project and profile tree...\n');

    // Ensure keys directory exists
    if (!fs.existsSync(this.keysDir)) {
      fs.mkdirSync(this.keysDir, { recursive: true });
      console.log('✅ Created keys directory');
    }

    // Check if admin.json exists, if not create it from existing keypairs
    const adminKeyPath = path.join(this.keysDir, 'admin.json');
    
    if (!fs.existsSync(adminKeyPath)) {
      console.log('🔑 Admin key not found, creating from existing project data...');
      await this.createAdminKeyFromExisting();
    }

    // Load admin keypair
    try {
      const adminKeyData = JSON.parse(fs.readFileSync(adminKeyPath, 'utf8'));
      this.adminKeypair = web3.Keypair.fromSecretKey(new Uint8Array(adminKeyData));
      console.log('✅ Admin keypair loaded');
      console.log(`👑 Admin Public Key: ${this.adminKeypair.publicKey.toString()}`);
    } catch (error) {
      throw new Error(`Failed to load admin keypair: ${error.message}`);
    }
  }

  async createAdminKeyFromExisting() {
    // Try to load from existing honeycomb-project-details.json
    const projectDetailsPath = path.join(__dirname, '..', 'honeycomb-project-details.json');
    
    if (fs.existsSync(projectDetailsPath)) {
      const existingData = JSON.parse(fs.readFileSync(projectDetailsPath, 'utf8'));
      
      if (existingData.keypairs && existingData.keypairs.authority) {
        // Use the authority keypair as admin
        const adminKeyPath = path.join(this.keysDir, 'admin.json');
        fs.writeFileSync(adminKeyPath, JSON.stringify(existingData.keypairs.authority));
        console.log('✅ Created admin.json from existing authority keypair');
        return;
      }
    }

    // If no existing data, generate new keypair
    const newAdminKeypair = web3.Keypair.generate();
    const adminKeyPath = path.join(this.keysDir, 'admin.json');
    fs.writeFileSync(adminKeyPath, JSON.stringify(Array.from(newAdminKeypair.secretKey)));
    console.log('✅ Generated new admin keypair');
    console.log(`👑 New Admin Public Key: ${newAdminKeypair.publicKey.toString()}`);
  }

  async runCreateProject() {
    console.log('\n🏗️  RUNNING CREATE PROJECT');
    console.log('='.repeat(35));

    try {
      // Dynamic import of the createProject function
      const { createProject } = await import('./honeycomb-project-creator.js');

      console.log('📋 Project Configuration:');
      console.log('  Name: G-Bax Space Exploration Game');
      console.log(`  Authority: ${this.adminKeypair.publicKey.toString()}`);
      console.log(`  Payer: ${this.adminKeypair.publicKey.toString()}`);
      console.log('  Subsidize Fees: true');
      console.log('  Create Profiles Tree: true');
      console.log('  Create Badging Criteria: true');

      console.log('\n🔄 Creating project...');

      // Call the createProject function with default parameters
      const project = await createProject(
        "G-Bax Space Exploration Game", // name
        this.adminKeypair.publicKey.toString(), // authority
        this.adminKeypair.publicKey.toString(), // payer
        true, // subsidizeFees
        true, // createProfilesTree
        true  // createBadgingCriteria
      );

      console.log('\n🎉 PROJECT CREATED SUCCESSFULLY!');
      console.log('='.repeat(45));
      console.log(`📍 Project Address: ${project.address}`);
      console.log(`👑 Authority: ${project.authority}`);
      console.log(`💳 Payer: ${project.payer}`);
      console.log(`🌳 Profile Tree: ${project.profilesTreeAddress || 'Created'}`);
      console.log(`🏷️  Badging Criteria: ${project.badgeCriteria ? 'Created' : 'Not Created'}`);
      console.log(`💰 Subsidized: ${project.subsidyFees ? 'Yes' : 'No'}`);

      // Debug: Log the actual project object to see what we have
      console.log('\n🔍 DEBUG - Project object profile tree info:');
      console.log(`  profilesTreeAddress: ${project.profilesTreeAddress}`);
      console.log(`  profileTree: ${JSON.stringify(project.profileTree, null, 2)}`);

      return project;

    } catch (error) {
      console.error('❌ Failed to create project:', error.message);
      throw error;
    }
  }

  async saveProjectDetails(project) {
    console.log('\n📝 SAVING PROJECT DETAILS');
    console.log('='.repeat(30));

    try {
      const timestamp = new Date().toISOString();
      
      // Prepare comprehensive project details
      const projectDetails = {
        timestamp,
        network: "honeynet",
        rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://rpc.test.honeycombprotocol.com",
        edgeApiUrl: process.env.NEXT_PUBLIC_HONEYCOMB_EDGE_API_URL || "https://edge.test.honeycombprotocol.com/",
        
        // Project information
        projectAddress: project.address,
        authorityPublicKey: project.authority,
        payerPublicKey: project.payer,
        
        // Project configuration
        projectConfig: {
          name: "G-Bax Space Exploration Game",
          authority: project.authority,
          payer: project.payer,
          subsidizeFees: project.subsidyFees || true,
          profileDataConfig: {
            achievements: [
              "Pioneer Explorer",
              "Master Miner", 
              "Resource Collector",
              "Mission Specialist",
              "Guild Leader",
              "Veteran Explorer",
              "Elite Pilot",
              "Legendary Adventurer"
            ],
            customDataFields: [
              "total_mining_time",
              "resources_collected", 
              "missions_completed",
              "exploration_distance",
              "guild_contributions",
              "rare_discoveries",
              "trading_volume",
              "loyalty_points"
            ]
          }
        },

        // Profile tree information
        profileTree: {
          address: project.profilesTreeAddress || project.profileTree?.address || null,
          created: !!(project.profilesTreeAddress || project.profileTree?.address),
          config: {
            advanced: {
              maxDepth: 3,
              maxBufferSize: 8,
              canopyDepth: 3
            }
          }
        },

        // Badging information
        badging: {
          created: !!project.badgeCriteria,
          criteria: project.badgeCriteria || null
        },

        // Transaction details
        transactionDetails: {
          createdAt: timestamp,
          method: "createProject from honeycombHelpers.ts",
          subsidyFees: project.subsidyFees || true
        },

        // Keypair information
        keypairs: {
          authority: Array.from(this.adminKeypair.secretKey),
          payer: Array.from(this.adminKeypair.secretKey), // Same as authority
          admin: Array.from(this.adminKeypair.secretKey)
        }
      };

      // Save to honeycomb-project-details.json
      const projectDetailsPath = path.join(__dirname, '..', 'honeycomb-project-details.json');
      fs.writeFileSync(projectDetailsPath, JSON.stringify(projectDetails, null, 2));
      console.log('✅ Updated honeycomb-project-details.json');

      // Save to a new detailed file with timestamp
      const detailedFileName = `honeycomb-setup-${timestamp.replace(/[:.]/g, '-')}.json`;
      const detailedPath = path.join(__dirname, '..', detailedFileName);
      
      const detailedData = {
        ...projectDetails,
        fullProjectData: project,
        setupMethod: "honeycombHelpers.createProject",
        features: {
          projectCreated: true,
          profileTreeCreated: !!project.profilesTreeAddress,
          badgingCriteriaCreated: !!project.badgeCriteria,
          subsidyFeesEnabled: project.subsidyFees || true
        }
      };

      fs.writeFileSync(detailedPath, JSON.stringify(detailedData, null, 2));
      console.log(`✅ Created detailed setup file: ${detailedFileName}`);

      return { projectDetails, detailedData };

    } catch (error) {
      console.error('❌ Failed to save project details:', error.message);
      throw error;
    }
  }

  async updateEnvironmentFile(project) {
    console.log('\n📝 UPDATING ENVIRONMENT FILE');
    console.log('='.repeat(35));

    try {
      const envPath = path.join(__dirname, '..', '.env.local');
      let envContent = fs.readFileSync(envPath, 'utf8');

      // Update project address
      envContent = envContent.replace(
        /NEXT_PUBLIC_HONEYCOMB_PROJECT_ADDRESS=.*/,
        `NEXT_PUBLIC_HONEYCOMB_PROJECT_ADDRESS=${project.address}`
      );

      // Update profile tree address if available
      const treeAddress = project.profilesTreeAddress || project.profileTree?.address;
      if (treeAddress) {
        if (envContent.includes('NEXT_PUBLIC_PROFILE_TREE_ADDRESS=')) {
          envContent = envContent.replace(
            /NEXT_PUBLIC_PROFILE_TREE_ADDRESS=.*/,
            `NEXT_PUBLIC_PROFILE_TREE_ADDRESS=${treeAddress}`
          );
        } else {
          // Add the profile tree address if it doesn't exist
          envContent += `\nNEXT_PUBLIC_PROFILE_TREE_ADDRESS=${treeAddress}\n`;
        }
        console.log(`🌳 Profile tree address added to environment: ${treeAddress}`);
      } else {
        console.log('⚠️  Profile tree address not available - may need to be added manually');
        console.log(`   Debug: project.profilesTreeAddress = ${project.profilesTreeAddress}`);
        console.log(`   Debug: project.profileTree = ${JSON.stringify(project.profileTree, null, 2)}`);
      }

      // Update authority and payer keys
      envContent = envContent.replace(
        /NEXT_PUBLIC_AUTHORITY_PUBLIC_KEY=.*/,
        `NEXT_PUBLIC_AUTHORITY_PUBLIC_KEY=${project.authority}`
      );

      envContent = envContent.replace(
        /NEXT_PUBLIC_PAYER_PUBLIC_KEY=.*/,
        `NEXT_PUBLIC_PAYER_PUBLIC_KEY=${project.payer}`
      );

      fs.writeFileSync(envPath, envContent);
      console.log('✅ Environment file updated with new project details');

    } catch (error) {
      console.log(`⚠️  Could not update environment file: ${error.message}`);
    }
  }

  async run() {
    try {
      await this.initialize();
      
      const project = await this.runCreateProject();
      
      const { projectDetails } = await this.saveProjectDetails(project);
      
      await this.updateEnvironmentFile(project);

      console.log('\n🎉 HONEYCOMB PROJECT SETUP COMPLETE!');
      console.log('='.repeat(50));
      console.log(`📍 Project Address: ${project.address}`);
      console.log(`🌳 Profile Tree: ${project.profilesTreeAddress || 'Created'}`);
      console.log(`🏷️  Badging: ${project.badgeCriteria ? 'Enabled' : 'Disabled'}`);
      console.log(`💰 Subsidized: ${project.subsidyFees ? 'Yes' : 'No'}`);
      console.log('✅ Project details saved to JSON files');
      console.log('✅ Environment file updated');
      console.log('\n🎮 Ready for game integration!');
      console.log('Start your game with: npm run dev');

    } catch (error) {
      console.error('\n❌ HONEYCOMB PROJECT SETUP FAILED');
      console.error('Error:', error.message);
      
      // Provide helpful error messages
      if (error.message.includes('admin.json')) {
        console.log('\n💡 SOLUTION:');
        console.log('Make sure the keys directory exists and admin.json is properly formatted');
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
  const setup = new HoneycombProjectSetup();
  setup.run().catch(console.error);
}

export { HoneycombProjectSetup };
