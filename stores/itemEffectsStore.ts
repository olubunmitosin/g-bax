import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface ItemEffect {
  id: string;
  name: string;
  type: 'mining_efficiency' | 'crafting_speed' | 'experience_boost' | 'resource_yield' | 'energy_restore';
  multiplier: number;
  duration: number; // in milliseconds
  startTime: number;
  isActive: boolean;
  description: string;
  quantity?: number; // Number of items used for this effect
}

export interface ItemEffectsState {
  activeEffects: ItemEffect[];
  totalItemsUsed: number; // Track total items used for tiered benefits

  // Actions
  addEffect: (effect: Omit<ItemEffect, 'id' | 'startTime' | 'isActive'>) => void;
  useItems: (type: ItemEffect['type'], quantity: number, duration: number, name: string) => void;
  removeEffect: (effectId: string) => void;
  updateEffects: () => void;
  getActiveMultipliers: () => {
    miningEfficiency: number;
    craftingSpeed: number;
    experienceBoost: number;
    resourceYield: number;
  };
  getTieredBenefit: (itemsUsed: number) => number;
  clearExpiredEffects: () => void;
  reset: () => void;
}

export const useItemEffectsStore = create<ItemEffectsState>()(
  devtools(
    persist(
      (set, get) => ({
        activeEffects: [],
        totalItemsUsed: 0,

        addEffect: (effectData) => {
          const effect: ItemEffect = {
            ...effectData,
            id: `effect_${Date.now()}_${Math.random()}`,
            startTime: Date.now(),
            isActive: true,
          };

          set((state) => ({
            activeEffects: [...state.activeEffects, effect],
          }));

          // Auto-remove effect after duration
          setTimeout(() => {
            get().removeEffect(effect.id);
          }, effect.duration);
        },

        // New method for using items with tiered benefits
        useItems: (type, quantity, duration, name) => {
          const { getTieredBenefit } = get();

          // Update total items used
          set((state) => ({
            totalItemsUsed: state.totalItemsUsed + quantity,
          }));

          // Get the new total and calculate tiered benefit
          const newTotal = get().totalItemsUsed;
          const benefitMultiplier = getTieredBenefit(newTotal);

          // Remove any existing effects of the same type
          set((state) => ({
            activeEffects: state.activeEffects.filter(effect => effect.type !== type),
          }));

          // Add new effect with tiered benefit
          const effect: ItemEffect = {
            name: `${name} (${quantity} items used, ${newTotal} total)`,
            type,
            multiplier: benefitMultiplier,
            duration,
            quantity,
            id: `effect_${Date.now()}_${Math.random()}`,
            startTime: Date.now(),
            isActive: true,
            description: `${Math.round((benefitMultiplier - 1) * 100)}% boost from ${newTotal} total items used`,
          };

          set((state) => ({
            activeEffects: [...state.activeEffects, effect],
          }));

          // Auto-remove effect after duration
          setTimeout(() => {
            get().removeEffect(effect.id);
          }, duration);
        },

        removeEffect: (effectId) => {
          set((state) => ({
            activeEffects: state.activeEffects.filter(effect => effect.id !== effectId),
          }));
        },

        updateEffects: () => {
          const now = Date.now();
          set((state) => ({
            activeEffects: state.activeEffects.map(effect => ({
              ...effect,
              isActive: (now - effect.startTime) < effect.duration,
            })),
          }));
        },

        getActiveMultipliers: () => {
          const { activeEffects } = get();
          const now = Date.now();

          const multipliers = {
            miningEfficiency: 1.0,
            craftingSpeed: 1.0,
            experienceBoost: 1.0,
            resourceYield: 1.0,
          };

          // With tiered system, each effect type should only have one active effect
          // representing the current tier benefit
          activeEffects.forEach(effect => {
            const isStillActive = (now - effect.startTime) < effect.duration;
            if (!isStillActive) return;

            switch (effect.type) {
              case 'mining_efficiency':
                multipliers.miningEfficiency = Math.max(multipliers.miningEfficiency, effect.multiplier);
                break;
              case 'crafting_speed':
                multipliers.craftingSpeed = Math.max(multipliers.craftingSpeed, effect.multiplier);
                break;
              case 'experience_boost':
                multipliers.experienceBoost = Math.max(multipliers.experienceBoost, effect.multiplier);
                break;
              case 'resource_yield':
                multipliers.resourceYield = Math.max(multipliers.resourceYield, effect.multiplier);
                break;
            }
          });

          return multipliers;
        },

        // Calculate tiered benefit based on total items used
        getTieredBenefit: (itemsUsed) => {
          if (itemsUsed >= 101) return 1.70; // 70% benefit
          if (itemsUsed >= 41) return 1.50;  // 50% benefit
          if (itemsUsed >= 26) return 1.35;  // 35% benefit
          if (itemsUsed >= 11) return 1.20;  // 20% benefit
          if (itemsUsed >= 5) return 1.10;   // 10% benefit
          if (itemsUsed >= 1) return 1.03;   // 3% benefit
          return 1.0; // No benefit
        },

        clearExpiredEffects: () => {
          const now = Date.now();
          set((state) => ({
            activeEffects: state.activeEffects.filter(effect =>
              (now - effect.startTime) < effect.duration
            ),
          }));
        },

        // Reset all item effects and total items used
        reset: () => {
          set({
            activeEffects: [],
            totalItemsUsed: 0,
          });
        },
      }),
      {
        name: 'item-effects-storage',
        version: 1,
      }
    ),
    { name: 'ItemEffectsStore' }
  )
);

// Export reset function for external use
export const resetItemEffectsStore = () => {
  useItemEffectsStore.getState().reset();
  // Also clear the persisted storage
  localStorage.removeItem('item-effects-storage');
};
