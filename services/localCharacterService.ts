/**
 * Local Character Service
 * Handles all character and trait operations using local storage instead of blockchain
 */

import type { TraitDefinition } from "@/data/traits";
import { PREDEFINED_TRAITS, getTraitById, getAvailableTraits } from "@/data/traits";

export interface LocalCharacterTrait {
  id: string;
  name: string;
  category: "mining" | "exploration" | "crafting" | "combat" | "social";
  level: number;
  experience: number;
  effects: Record<string, number>;
  assignedAt: string;
  lastUpdated: string;
}

export interface LocalCharacter {
  id: string;
  playerId: string;
  name: string;
  level: number;
  experience: number;
  traits: LocalCharacterTrait[];
  bonuses: {
    miningBonus: number;
    craftingBonus: number;
    explorationBonus: number;
    combatBonus: number;
    leadershipBonus: number;
    experienceBonus: number;
  };
  createdAt: string;
  lastUpdated: string;
}

export interface LocalCharacterData {
  characters: Record<string, LocalCharacter>;
  activeCharacterId: string | null;
  lastSyncTimestamp: string;
}

export class LocalCharacterService {
  private readonly STORAGE_KEY = "g-bax-characters";
  private readonly BACKUP_KEY = "g-bax-characters-backup";

  /**
   * Initialize the local character system
   */
  initialize(playerId: string): LocalCharacterData {
    try {
      const existingData = this.loadCharacterData();
      if (existingData) {
        const updatedData = {
          ...existingData,
          lastSyncTimestamp: new Date().toISOString(),
        };
        this.saveCharacterData(updatedData);
        return updatedData;
      }

      // Create initial character data
      const initialData: LocalCharacterData = {
        characters: {},
        activeCharacterId: null,
        lastSyncTimestamp: new Date().toISOString(),
      };

      this.saveCharacterData(initialData);
      return initialData;
    } catch (error) {return this.createFallbackData();
    }
  }

  /**
   * Create a new character for a player
   */
  createCharacter(
    playerId: string,
    characterName: string,
    initialTraits: string[][] = []
  ): LocalCharacter {
    const data = this.loadCharacterData();
    if (!data) throw new Error("Character data not found");

    const characterId = `${playerId}-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Convert initial traits to LocalCharacterTrait format
    const traits: LocalCharacterTrait[] = initialTraits.map(([category, name]) => {
      const traitDef = PREDEFINED_TRAITS.find(t =>
        t.category === category.toLowerCase() && t.name === name
      );

      return {
        id: traitDef?.id || `${category.toLowerCase()}_${name.toLowerCase().replace(/\s+/g, '_')}`,
        name,
        category: category.toLowerCase() as LocalCharacterTrait["category"],
        level: 1,
        experience: 0,
        effects: traitDef?.baseEffects || {},
        assignedAt: timestamp,
        lastUpdated: timestamp,
      };
    });

    const character: LocalCharacter = {
      id: characterId,
      playerId,
      name: characterName,
      level: 1,
      experience: 0,
      traits,
      bonuses: this.calculateBonuses(traits),
      createdAt: timestamp,
      lastUpdated: timestamp,
    };

    const updatedData: LocalCharacterData = {
      ...data,
      characters: {
        ...data.characters,
        [characterId]: character,
      },
      activeCharacterId: characterId,
      lastSyncTimestamp: timestamp,
    };

    this.saveCharacterData(updatedData);
    return character;
  }

  /**
   * Get character by player ID
   */
  getPlayerCharacter(playerId: string): LocalCharacter | null {
    const data = this.loadCharacterData();
    if (!data) return null;

    // Find character for this player
    const playerCharacter = Object.values(data.characters).find(
      char => char.playerId === playerId
    );

    return playerCharacter || null;
  }

  /**
   * Get character by ID
   */
  getCharacterById(characterId: string): LocalCharacter | null {
    const data = this.loadCharacterData();
    if (!data) return null;

    return data.characters[characterId] || null;
  }

  /**
   * Assign a trait to a character
   */
  assignTrait(
    characterId: string,
    traitCategory: string,
    traitName: string
  ): LocalCharacter {
    const data = this.loadCharacterData();
    if (!data) throw new Error("Character data not found");

    const character = data.characters[characterId];
    if (!character) throw new Error("Character not found");

    // Check if trait already exists
    const existingTrait = character.traits.find(
      t => t.category === traitCategory.toLowerCase() && t.name === traitName
    );
    if (existingTrait) {
      throw new Error("Trait already assigned");
    }

    // Find trait definition
    const traitDef = PREDEFINED_TRAITS.find(t =>
      t.category === traitCategory.toLowerCase() && t.name === traitName
    );

    const timestamp = new Date().toISOString();
    const newTrait: LocalCharacterTrait = {
      id: traitDef?.id || `${traitCategory.toLowerCase()}_${traitName.toLowerCase().replace(/\s+/g, '_')}`,
      name: traitName,
      category: traitCategory.toLowerCase() as LocalCharacterTrait["category"],
      level: 1,
      experience: 0,
      effects: traitDef?.baseEffects || {},
      assignedAt: timestamp,
      lastUpdated: timestamp,
    };

    const updatedTraits = [...character.traits, newTrait];
    const updatedCharacter: LocalCharacter = {
      ...character,
      traits: updatedTraits,
      bonuses: this.calculateBonuses(updatedTraits),
      lastUpdated: timestamp,
    };

    const updatedData: LocalCharacterData = {
      ...data,
      characters: {
        ...data.characters,
        [characterId]: updatedCharacter,
      },
      lastSyncTimestamp: timestamp,
    };

    this.saveCharacterData(updatedData);
    return updatedCharacter;
  }

  /**
   * Evolve a trait (upgrade to next level or different trait)
   */
  evolveTrait(
    characterId: string,
    traitId: string,
    newTraitName?: string
  ): LocalCharacter {
    const data = this.loadCharacterData();
    if (!data) throw new Error("Character data not found");

    const character = data.characters[characterId];
    if (!character) throw new Error("Character not found");

    const traitIndex = character.traits.findIndex(t => t.id === traitId);
    if (traitIndex === -1) throw new Error("Trait not found");

    const currentTrait = character.traits[traitIndex];
    const timestamp = new Date().toISOString();

    let updatedTrait: LocalCharacterTrait;

    if (newTraitName) {
      // Evolution to a different trait
      const newTraitDef = PREDEFINED_TRAITS.find(t => t.name === newTraitName);
      updatedTrait = {
        ...currentTrait,
        id: newTraitDef?.id || currentTrait.id,
        name: newTraitName,
        level: 1,
        experience: 0,
        effects: newTraitDef?.baseEffects || currentTrait.effects,
        lastUpdated: timestamp,
      };
    } else {
      // Level up current trait
      const traitDef = getTraitById(currentTrait.id);
      const newLevel = Math.min(currentTrait.level + 1, traitDef?.maxLevel || 10);

      updatedTrait = {
        ...currentTrait,
        level: newLevel,
        experience: 0,
        effects: this.calculateTraitEffects(currentTrait.id, newLevel),
        lastUpdated: timestamp,
      };
    }

    const updatedTraits = [...character.traits];
    updatedTraits[traitIndex] = updatedTrait;

    const updatedCharacter: LocalCharacter = {
      ...character,
      traits: updatedTraits,
      bonuses: this.calculateBonuses(updatedTraits),
      lastUpdated: timestamp,
    };

    const updatedData: LocalCharacterData = {
      ...data,
      characters: {
        ...data.characters,
        [characterId]: updatedCharacter,
      },
      lastSyncTimestamp: timestamp,
    };

    this.saveCharacterData(updatedData);
    return updatedCharacter;
  }

  /**
   * Add experience to character
   */
  addExperience(characterId: string, experience: number): LocalCharacter {
    const data = this.loadCharacterData();
    if (!data) throw new Error("Character data not found");

    const character = data.characters[characterId];
    if (!character) throw new Error("Character not found");

    const newExperience = character.experience + experience;
    const newLevel = this.calculateLevel(newExperience);
    const timestamp = new Date().toISOString();

    const updatedCharacter: LocalCharacter = {
      ...character,
      experience: newExperience,
      level: newLevel,
      lastUpdated: timestamp,
    };

    const updatedData: LocalCharacterData = {
      ...data,
      characters: {
        ...data.characters,
        [characterId]: updatedCharacter,
      },
      lastSyncTimestamp: timestamp,
    };

    this.saveCharacterData(updatedData);
    return updatedCharacter;
  }

  /**
   * Get available traits for a character
   */
  getAvailableTraitsForCharacter(characterId: string): TraitDefinition[] {
    const character = this.getCharacterById(characterId);
    if (!character) return [];

    const completedMissions: string[] = []; // TODO: Get from mission service
    const playerTraitIds = character.traits.map(t => t.id);

    return getAvailableTraits(character.level, completedMissions, playerTraitIds);
  }

  /**
   * Reset character data (for testing or new player)
   */
  resetCharacters(): LocalCharacterData {
    const initialData: LocalCharacterData = {
      characters: {},
      activeCharacterId: null,
      lastSyncTimestamp: new Date().toISOString(),
    };

    this.saveCharacterData(initialData);
    return initialData;
  }

  /**
   * Create backup of character data
   */
  createBackup(): void {
    const data = this.loadCharacterData();
    if (data) {
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(data));
    }
  }

  /**
   * Restore from backup
   */
  restoreFromBackup(): LocalCharacterData | null {
    try {
      const backupData = localStorage.getItem(this.BACKUP_KEY);
      if (backupData) {
        const data = JSON.parse(backupData) as LocalCharacterData;
        this.saveCharacterData(data);
        return data;
      }
    } catch (error) {}
    return null;
  }

  // Private methods

  private loadCharacterData(): LocalCharacterData | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {return null;
    }
  }

  private saveCharacterData(data: LocalCharacterData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {}
  }

  private calculateBonuses(traits: LocalCharacterTrait[]) {
    const bonuses = {
      miningBonus: 0,
      craftingBonus: 0,
      explorationBonus: 0,
      combatBonus: 0,
      leadershipBonus: 0,
      experienceBonus: 0,
    };

    traits.forEach(trait => {
      // Map trait effects to bonuses
      Object.entries(trait.effects).forEach(([effect, value]) => {
        switch (effect) {
          case "miningSpeed":
          case "resourceYield":
          case "rareResourceChance":
            bonuses.miningBonus += (value - 1) * 100; // Convert multiplier to percentage
            break;
          case "craftingSpeed":
          case "craftingQuality":
            bonuses.craftingBonus += (value - 1) * 100;
            break;
          case "explorationRange":
          case "discoveryChance":
            bonuses.explorationBonus += (value - 1) * 100;
            break;
          case "combatDamage":
          case "combatDefense":
            bonuses.combatBonus += (value - 1) * 100;
            break;
          case "leadershipEfficiency":
          case "teamBonus":
            bonuses.leadershipBonus += (value - 1) * 100;
            break;
          case "experienceGain":
            bonuses.experienceBonus += (value - 1) * 100;
            break;
        }
      });
    });

    return bonuses;
  }

  private calculateTraitEffects(traitId: string, level: number): Record<string, number> {
    const traitDef = getTraitById(traitId);
    if (!traitDef) return {};

    const effects: Record<string, number> = {};

    Object.entries(traitDef.baseEffects).forEach(([effect, baseValue]) => {
      const multiplier = traitDef.levelMultiplier[effect] || 0;
      effects[effect] = baseValue + (multiplier * (level - 1));
    });

    return effects;
  }

  private calculateLevel(experience: number): number {
    // Simple level calculation: 100 XP per level
    return Math.floor(experience / 100) + 1;
  }

  private createFallbackData(): LocalCharacterData {
    return {
      characters: {},
      activeCharacterId: null,
      lastSyncTimestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const localCharacterService = new LocalCharacterService();
