export interface TraitDefinition {
  id: string;
  name: string;
  description: string;
  category: 'mining' | 'exploration' | 'crafting' | 'combat' | 'social';
  maxLevel: number;
  baseEffects: Record<string, number>;
  levelMultiplier: Record<string, number>;
  unlockRequirements?: {
    level?: number;
    completedMissions?: string[];
    otherTraits?: string[];
  };
}

export const PREDEFINED_TRAITS: TraitDefinition[] = [
  // Mining Traits
  {
    id: 'mining_efficiency',
    name: 'Mining Efficiency',
    description: 'Increases the speed and yield of mining operations.',
    category: 'mining',
    maxLevel: 10,
    baseEffects: {
      miningSpeed: 1.1,
      resourceYield: 1.05,
    },
    levelMultiplier: {
      miningSpeed: 0.1,
      resourceYield: 0.05,
    },
  },

  {
    id: 'ore_detection',
    name: 'Ore Detection',
    description: 'Enhances ability to locate valuable resources in asteroids.',
    category: 'mining',
    maxLevel: 8,
    baseEffects: {
      rareResourceChance: 1.15,
      detectionRange: 1.2,
    },
    levelMultiplier: {
      rareResourceChance: 0.1,
      detectionRange: 0.15,
    },
    unlockRequirements: {
      level: 3,
      completedMissions: ['mining_001'],
    },
  },

  {
    id: 'crystal_resonance',
    name: 'Crystal Resonance',
    description: 'Specialized knowledge in crystal extraction and purification.',
    category: 'mining',
    maxLevel: 6,
    baseEffects: {
      crystalYield: 1.25,
      crystalPurity: 1.1,
    },
    levelMultiplier: {
      crystalYield: 0.2,
      crystalPurity: 0.1,
    },
    unlockRequirements: {
      level: 5,
      completedMissions: ['mining_002'],
    },
  },

  // Exploration Traits
  {
    id: 'navigation_mastery',
    name: 'Navigation Mastery',
    description: 'Improved movement speed and fuel efficiency in space.',
    category: 'exploration',
    maxLevel: 10,
    baseEffects: {
      movementSpeed: 1.15,
      fuelEfficiency: 1.1,
    },
    levelMultiplier: {
      movementSpeed: 0.1,
      fuelEfficiency: 0.08,
    },
  },

  {
    id: 'sector_mapping',
    name: 'Sector Mapping',
    description: 'Enhanced ability to discover and catalog space objects.',
    category: 'exploration',
    maxLevel: 8,
    baseEffects: {
      discoveryRange: 1.3,
      mappingAccuracy: 1.2,
    },
    levelMultiplier: {
      discoveryRange: 0.2,
      mappingAccuracy: 0.15,
    },
    unlockRequirements: {
      level: 2,
      completedMissions: ['exploration_001'],
    },
  },

  {
    id: 'deep_space_adaptation',
    name: 'Deep Space Adaptation',
    description: 'Resistance to the harsh conditions of deep space exploration.',
    category: 'exploration',
    maxLevel: 7,
    baseEffects: {
      hazardResistance: 1.2,
      explorationEndurance: 1.25,
    },
    levelMultiplier: {
      hazardResistance: 0.15,
      explorationEndurance: 0.2,
    },
    unlockRequirements: {
      level: 6,
      completedMissions: ['exploration_002'],
    },
  },

  // Crafting Traits
  {
    id: 'material_synthesis',
    name: 'Material Synthesis',
    description: 'Improved efficiency in combining and refining materials.',
    category: 'crafting',
    maxLevel: 10,
    baseEffects: {
      craftingSpeed: 1.2,
      materialEfficiency: 1.1,
    },
    levelMultiplier: {
      craftingSpeed: 0.15,
      materialEfficiency: 0.08,
    },
  },

  {
    id: 'blueprint_mastery',
    name: 'Blueprint Mastery',
    description: 'Enhanced understanding of complex crafting patterns and designs.',
    category: 'crafting',
    maxLevel: 8,
    baseEffects: {
      craftingQuality: 1.15,
      blueprintEfficiency: 1.1,
    },
    levelMultiplier: {
      craftingQuality: 0.12,
      blueprintEfficiency: 0.1,
    },
    unlockRequirements: {
      level: 3,
      completedMissions: ['crafting_001'],
    },
  },

  {
    id: 'legendary_forging',
    name: 'Legendary Forging',
    description: 'Mastery in creating the most powerful and rare equipment.',
    category: 'crafting',
    maxLevel: 5,
    baseEffects: {
      legendaryChance: 1.5,
      forgingPrecision: 1.3,
    },
    levelMultiplier: {
      legendaryChance: 0.3,
      forgingPrecision: 0.2,
    },
    unlockRequirements: {
      level: 8,
      completedMissions: ['crafting_002'],
      otherTraits: ['material_synthesis', 'blueprint_mastery'],
    },
  },

  // Combat Traits
  {
    id: 'tactical_awareness',
    name: 'Tactical Awareness',
    description: 'Enhanced combat reflexes and situational awareness.',
    category: 'combat',
    maxLevel: 10,
    baseEffects: {
      combatAccuracy: 1.1,
      dodgeChance: 1.15,
    },
    levelMultiplier: {
      combatAccuracy: 0.08,
      dodgeChance: 0.1,
    },
  },

  {
    id: 'shield_mastery',
    name: 'Shield Mastery',
    description: 'Improved shield efficiency and energy management.',
    category: 'combat',
    maxLevel: 8,
    baseEffects: {
      shieldCapacity: 1.2,
      shieldRegeneration: 1.15,
    },
    levelMultiplier: {
      shieldCapacity: 0.15,
      shieldRegeneration: 0.12,
    },
    unlockRequirements: {
      level: 4,
    },
  },

  {
    id: 'weapon_specialization',
    name: 'Weapon Specialization',
    description: 'Advanced proficiency with space combat weapons.',
    category: 'combat',
    maxLevel: 7,
    baseEffects: {
      weaponDamage: 1.25,
      weaponEfficiency: 1.1,
    },
    levelMultiplier: {
      weaponDamage: 0.2,
      weaponEfficiency: 0.1,
    },
    unlockRequirements: {
      level: 6,
      otherTraits: ['tactical_awareness'],
    },
  },

  // Social Traits
  {
    id: 'diplomatic_relations',
    name: 'Diplomatic Relations',
    description: 'Enhanced ability to negotiate and build relationships with stations.',
    category: 'social',
    maxLevel: 8,
    baseEffects: {
      tradingBonus: 1.15,
      reputationGain: 1.2,
    },
    levelMultiplier: {
      tradingBonus: 0.1,
      reputationGain: 0.15,
    },
  },

  {
    id: 'guild_leadership',
    name: 'Guild Leadership',
    description: 'Natural leadership abilities that inspire and coordinate teams.',
    category: 'social',
    maxLevel: 6,
    baseEffects: {
      teamBonus: 1.2,
      leadershipRange: 1.3,
    },
    levelMultiplier: {
      teamBonus: 0.15,
      leadershipRange: 0.2,
    },
    unlockRequirements: {
      level: 7,
      completedMissions: ['exploration_003'],
    },
  },

  {
    id: 'network_influence',
    name: 'Network Influence',
    description: 'Extensive connections across the galaxy providing unique opportunities.',
    category: 'social',
    maxLevel: 5,
    baseEffects: {
      missionAccess: 1.5,
      informationNetwork: 1.4,
    },
    levelMultiplier: {
      missionAccess: 0.3,
      informationNetwork: 0.25,
    },
    unlockRequirements: {
      level: 10,
      otherTraits: ['diplomatic_relations', 'guild_leadership'],
    },
  },
];

// Helper functions
export function getTraitById(traitId: string): TraitDefinition | undefined {
  return PREDEFINED_TRAITS.find(trait => trait.id === traitId);
}

export function getTraitsByCategory(category: TraitDefinition['category']): TraitDefinition[] {
  return PREDEFINED_TRAITS.filter(trait => trait.category === category);
}

export function getAvailableTraits(
  playerLevel: number,
  completedMissionIds: string[],
  playerTraitIds: string[]
): TraitDefinition[] {
  return PREDEFINED_TRAITS.filter(trait => {
    const requirements = trait.unlockRequirements;
    
    if (!requirements) return true; // No requirements
    
    // Check level requirement
    if (requirements.level && playerLevel < requirements.level) return false;
    
    // Check completed missions requirement
    if (requirements.completedMissions) {
      const hasCompletedRequired = requirements.completedMissions.every(
        requiredMissionId => completedMissionIds.includes(requiredMissionId)
      );
      if (!hasCompletedRequired) return false;
    }
    
    // Check other traits requirement
    if (requirements.otherTraits) {
      const hasRequiredTraits = requirements.otherTraits.every(
        requiredTraitId => playerTraitIds.includes(requiredTraitId)
      );
      if (!hasRequiredTraits) return false;
    }
    
    return true;
  });
}

export function calculateTraitEffects(traitId: string, level: number): Record<string, number> {
  const trait = getTraitById(traitId);
  if (!trait) return {};
  
  const effects: Record<string, number> = {};
  
  Object.keys(trait.baseEffects).forEach(effectKey => {
    const baseValue = trait.baseEffects[effectKey];
    const multiplier = trait.levelMultiplier[effectKey] || 0;
    effects[effectKey] = baseValue + (multiplier * (level - 1));
  });
  
  return effects;
}

export function getTraitUpgradeCost(traitId: string, currentLevel: number): number {
  const trait = getTraitById(traitId);
  if (!trait || currentLevel >= trait.maxLevel) return 0;
  
  // Base cost increases exponentially with level
  const baseCost = 1000;
  const levelMultiplier = 1.5;
  
  return Math.floor(baseCost * Math.pow(levelMultiplier, currentLevel));
}

export function getTraitDescription(traitId: string, level: number): string {
  const trait = getTraitById(traitId);
  if (!trait) return '';
  
  const effects = calculateTraitEffects(traitId, level);
  const effectDescriptions = Object.entries(effects).map(([key, value]) => {
    const percentage = ((value - 1) * 100).toFixed(0);
    return `${key}: +${percentage}%`;
  });
  
  return `${trait.description}\n\nLevel ${level} Effects:\n${effectDescriptions.join('\n')}`;
}
