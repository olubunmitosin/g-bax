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
}

export interface ItemEffectsState {
  activeEffects: ItemEffect[];

  // Actions
  addEffect: (effect: Omit<ItemEffect, 'id' | 'startTime' | 'isActive'>) => void;
  removeEffect: (effectId: string) => void;
  updateEffects: () => void;
  getActiveMultipliers: () => {
    miningEfficiency: number;
    craftingSpeed: number;
    experienceBoost: number;
    resourceYield: number;
  };
  clearExpiredEffects: () => void;
}

export const useItemEffectsStore = create<ItemEffectsState>()(
  devtools(
    persist(
      (set, get) => ({
        activeEffects: [],

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

          activeEffects.forEach(effect => {
            const isStillActive = (now - effect.startTime) < effect.duration;
            if (!isStillActive) return;

            switch (effect.type) {
              case 'mining_efficiency':
                multipliers.miningEfficiency *= effect.multiplier;
                break;
              case 'crafting_speed':
                multipliers.craftingSpeed *= effect.multiplier;
                break;
              case 'experience_boost':
                multipliers.experienceBoost *= effect.multiplier;
                break;
              case 'resource_yield':
                multipliers.resourceYield *= effect.multiplier;
                break;
            }
          });

          return multipliers;
        },

        clearExpiredEffects: () => {
          const now = Date.now();
          set((state) => ({
            activeEffects: state.activeEffects.filter(effect =>
              (now - effect.startTime) < effect.duration
            ),
          }));
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
