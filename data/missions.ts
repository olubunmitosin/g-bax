import type { Mission } from "@/stores/gameStore";

export const PREDEFINED_MISSIONS: Mission[] = [
  // Mining Missions
  {
    id: "mining_001",
    title: "First Steps in Space",
    description:
      "Complete your first mining operation by extracting resources from any asteroid. Click on any asteroid in space and wait for the mining to complete.",
    type: "mining",
    status: "available",
    rewards: {
      experience: 100,
      credits: 500,
      resources: [
        {
          id: "common_metal_001",
          name: "Common Metal",
          type: "metal",
          quantity: 5,
          rarity: "common",
        },
      ],
    },
    progress: 0,
    maxProgress: 1, // Mine 1 asteroid
  },

  {
    id: "mining_002",
    title: "Crystal Hunter",
    description:
      "Mine 5 crystal-containing asteroids to collect energy crystals. Look for asteroids that yield crystal resources (blue/purple colored resources) and complete 5 crystal mining operations.",
    type: "mining",
    status: "available",
    rewards: {
      experience: 250,
      credits: 1200,
      resources: [
        {
          id: "rare_crystal_001",
          name: "Rare Crystal",
          type: "crystal",
          quantity: 3,
          rarity: "rare",
        },
      ],
    },
    progress: 0,
    maxProgress: 5, // Mine 5 crystal nodes
  },

  {
    id: "mining_003",
    title: "Asteroid Field Surveyor",
    description:
      "Complete 15 mining operations on any asteroids. Click on asteroids throughout the sector and mine them until you reach 15 total mining completions.",
    type: "mining",
    status: "available",
    rewards: {
      experience: 400,
      credits: 2000,
      resources: [
        {
          id: "mixed_resources_001",
          name: "Mixed Resource Cache",
          type: "metal",
          quantity: 10,
          rarity: "common",
        },
      ],
    },
    progress: 0,
    maxProgress: 15, // Mine 15 objects in asteroid fields
  },

  // Exploration Missions
  {
    id: "exploration_001",
    title: "Sector Scout",
    description:
      "Explore the space sector by moving around and discovering 10 different objects. Use WASD keys to fly around and approach different asteroids, stations, or other space objects.",
    type: "exploration",
    status: "available",
    rewards: {
      experience: 200,
      credits: 800,
    },
    progress: 0,
    maxProgress: 10, // Discover 10 different objects
  },

  {
    id: "exploration_002",
    title: "Deep Space Cartographer",
    description:
      "Explore 25 different locations in space. Fly to various coordinates and discover new areas by moving your ship to different positions in the sector.",
    type: "exploration",
    status: "available",
    rewards: {
      experience: 500,
      credits: 2500,
      resources: [
        {
          id: "navigation_data_001",
          name: "Navigation Data",
          type: "energy",
          quantity: 1,
          rarity: "epic",
        },
      ],
    },
    progress: 0,
    maxProgress: 25, // Explore 25 different locations
  },

  {
    id: "exploration_003",
    title: "Station Diplomat",
    description:
      "Visit and interact with 2 different space stations. Look for large structures in space and approach them to establish contact.",
    type: "exploration",
    status: "available",
    rewards: {
      experience: 300,
      credits: 1500,
    },
    progress: 0,
    maxProgress: 2, // Visit 2 different stations
  },

  // Crafting Missions
  {
    id: "crafting_001",
    title: "Apprentice Forger",
    description:
      "Create your first crafted item using the crafting system. Open the crafting interface and combine resources to craft 1 item of any type.",
    type: "crafting",
    status: "available",
    rewards: {
      experience: 150,
      credits: 600,
      resources: [
        {
          id: "basic_tool_001",
          name: "Basic Mining Tool",
          type: "metal",
          quantity: 1,
          rarity: "common",
        },
      ],
    },
    progress: 0,
    maxProgress: 1, // Craft 1 item
  },

  {
    id: "crafting_002",
    title: "Resource Synthesizer",
    description:
      "Craft 5 items using the crafting system. Combine different resources to create tools, equipment, or other items. Each successful crafting operation counts toward progress.",
    type: "crafting",
    status: "available",
    rewards: {
      experience: 350,
      credits: 1800,
      resources: [
        {
          id: "advanced_alloy_001",
          name: "Advanced Alloy",
          type: "metal",
          quantity: 2,
          rarity: "rare",
        },
      ],
    },
    progress: 0,
    maxProgress: 5, // Craft 5 advanced items
  },

  {
    id: "crafting_003",
    title: "Master Craftsman",
    description:
      "Create 1 legendary-tier item through advanced crafting. Use rare and epic resources to craft a single high-quality legendary item.",
    type: "crafting",
    status: "available",
    rewards: {
      experience: 750,
      credits: 5000,
      resources: [
        {
          id: "legendary_equipment_001",
          name: "Legendary Equipment",
          type: "crystal",
          quantity: 1,
          rarity: "legendary",
        },
      ],
    },
    progress: 0,
    maxProgress: 1, // Craft 1 legendary item
  },

  // Advanced Missions
  {
    id: "advanced_001",
    title: "Elite Explorer",
    description:
      "Complete 50 exploration activities by flying around space and discovering new locations. Use WASD to navigate and explore different areas of the sector.",
    type: "exploration",
    status: "available",
    rewards: {
      experience: 1000,
      credits: 7500,
      resources: [
        {
          id: "explorer_badge_001",
          name: "Elite Explorer Badge",
          type: "energy",
          quantity: 1,
          rarity: "legendary",
        },
      ],
    },
    progress: 0,
    maxProgress: 50, // Complete 50 exploration actions
  },

  {
    id: "advanced_002",
    title: "Resource Magnate",
    description:
      "Complete 100 mining operations to become a master miner. Click on asteroids throughout space and complete mining operations until you reach 100 total completions.",
    type: "mining",
    status: "available",
    rewards: {
      experience: 800,
      credits: 10000,
    },
    progress: 0,
    maxProgress: 100, // Mine 100 total resources
  },

  {
    id: "advanced_003",
    title: "Guild Founder",
    description:
      "Complete 75 exploration activities to establish yourself as a space exploration leader. Fly around and discover new areas to build your reputation.",
    type: "exploration",
    status: "available",
    rewards: {
      experience: 1500,
      credits: 15000,
      resources: [
        {
          id: "guild_charter_001",
          name: "Guild Charter",
          type: "energy",
          quantity: 1,
          rarity: "legendary",
        },
      ],
    },
    progress: 0,
    maxProgress: 75, // Complete 75 exploration actions
  },
];

// Mission categories for UI organization
export const MISSION_CATEGORIES = {
  BEGINNER: {
    name: "Beginner Missions",
    description: "Perfect for new space explorers",
    missions: ["mining_001", "exploration_001", "crafting_001"],
  },
  INTERMEDIATE: {
    name: "Intermediate Missions",
    description: "For experienced explorers",
    missions: [
      "mining_002",
      "mining_003",
      "exploration_002",
      "exploration_003",
      "crafting_002",
    ],
  },
  ADVANCED: {
    name: "Advanced Missions",
    description: "Elite challenges for master explorers",
    missions: ["crafting_003", "advanced_001", "advanced_002", "advanced_003"],
  },
};

// Mission requirements and unlock conditions
export const MISSION_REQUIREMENTS = {
  mining_002: { level: 2, completedMissions: ["mining_001"] },
  mining_003: { level: 3, completedMissions: ["mining_002"] },
  exploration_002: { level: 3, completedMissions: ["exploration_001"] },
  exploration_003: { level: 2, completedMissions: ["exploration_001"] },
  crafting_002: { level: 3, completedMissions: ["crafting_001"] },
  crafting_003: { level: 5, completedMissions: ["crafting_002"] },
  advanced_001: {
    level: 8,
    completedMissions: ["exploration_002", "exploration_003"],
  },
  advanced_002: { level: 7, completedMissions: ["mining_003"] },
  advanced_003: {
    level: 10,
    completedMissions: ["advanced_001", "advanced_002"],
  },
};

// Helper functions
export function getMissionById(missionId: string): Mission | undefined {
  return PREDEFINED_MISSIONS.find((mission) => mission.id === missionId);
}

export function getMissionsByCategory(
  category: keyof typeof MISSION_CATEGORIES,
): Mission[] {
  const categoryData = MISSION_CATEGORIES[category];

  return categoryData.missions
    .map((missionId) => getMissionById(missionId))
    .filter((mission): mission is Mission => mission !== undefined);
}

export function getAvailableMissions(
  playerLevel: number,
  completedMissionIds: string[],
): Mission[] {
  return PREDEFINED_MISSIONS.filter((mission) => {
    const requirements =
      MISSION_REQUIREMENTS[mission.id as keyof typeof MISSION_REQUIREMENTS];

    if (!requirements) return true; // No requirements

    // Check level requirement
    if (requirements.level && playerLevel < requirements.level) return false;

    // Check completed missions requirement
    if (requirements.completedMissions) {
      const hasCompletedRequired = requirements.completedMissions.every(
        (requiredMissionId) => completedMissionIds.includes(requiredMissionId),
      );

      if (!hasCompletedRequired) return false;
    }

    return true;
  });
}

export function getMissionRewardValue(mission: Mission): number {
  let value = mission.rewards.experience + mission.rewards.credits;

  if (mission.rewards.resources) {
    value += mission.rewards.resources.reduce((total, resource) => {
      const rarityMultiplier = {
        common: 1,
        rare: 3,
        epic: 8,
        legendary: 20,
      }[resource.rarity];

      return total + resource.quantity * 100 * rarityMultiplier;
    }, 0);
  }

  return value;
}
