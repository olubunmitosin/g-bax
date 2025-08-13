import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export interface ItemEffect {
  id: string;
  name: string;
  type:
    | "mining_efficiency"
    | "crafting_speed"
    | "experience_boost"
    | "resource_yield"
    | "energy_restore";
  multiplier: number;
  duration: number; // in milliseconds
  startTime: number;
  isActive: boolean;
  description: string;
  quantity?: number;
}

// Internal interface for runtime effects with timeout tracking
interface RuntimeItemEffect extends ItemEffect {
  timeoutId?: NodeJS.Timeout; // Track timeout for cleanup
}

export interface ItemEffectsState {
  activeEffects: RuntimeItemEffect[];
  totalItemsUsed: number; // Track total items used for tiered benefits

  // Actions
  addEffect: (
    effect: Omit<ItemEffect, "id" | "startTime" | "isActive">,
  ) => void;
  useItems: (
    type: ItemEffect["type"],
    quantity: number,
    duration: number,
    name: string,
  ) => void;
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
  restartTimeouts: () => void;
  reset: () => void;
}

// Helper function to restart timeouts for active effects
const restartEffectTimeouts = (
  effects: RuntimeItemEffect[],
  removeEffect: (id: string) => void,
): RuntimeItemEffect[] => {
  const now = Date.now();

  return effects.map((effect) => {
    const remainingTime = effect.duration - (now - effect.startTime);

    if (remainingTime > 0) {
      // Effect is still active, restart its timeout
      const timeoutId = setTimeout(() => {
        removeEffect(effect.id);
      }, remainingTime);

      return { ...effect, timeoutId };
    } else {
      // Effect has expired, don't restart timeout
      return effect;
    }
  });
};

export const useItemEffectsStore = create<ItemEffectsState>()(
  devtools(
    persist<ItemEffectsState>(
      (set, get) => ({
        activeEffects: [],
        totalItemsUsed: 0,

        addEffect: (
          effectData: Omit<ItemEffect, "id" | "startTime" | "isActive">,
        ) => {
          const effectId = `effect_${Date.now()}_${Math.random()}`;

          // Auto-remove effect after duration
          const timeoutId = setTimeout(() => {
            get().removeEffect(effectId);
          }, effectData.duration);

          const effect: RuntimeItemEffect = {
            ...effectData,
            id: effectId,
            startTime: Date.now(),
            isActive: true,
            timeoutId,
          };

          set((state) => ({
            activeEffects: [...state.activeEffects, effect],
          }));
        },

        // New method for using items with tiered benefits
        useItems: (
          type: ItemEffect["type"],
          quantity: number,
          duration: number,
          name: string,
        ) => {
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
            activeEffects: state.activeEffects.filter(
              (effect) => effect.type !== type,
            ),
          }));

          // Add new effect with tiered benefit
          const effectId = `effect_${Date.now()}_${Math.random()}`;

          // Auto-remove effect after duration
          const timeoutId = setTimeout(() => {
            get().removeEffect(effectId);
          }, duration);

          const effect: RuntimeItemEffect = {
            name: `${name} (${quantity} items used, ${newTotal} total)`,
            type,
            multiplier: benefitMultiplier,
            duration,
            quantity,
            id: effectId,
            startTime: Date.now(),
            isActive: true,
            description: `${Math.round((benefitMultiplier - 1) * 100)}% boost from ${newTotal} total items used`,
            timeoutId,
          };

          set((state) => ({
            activeEffects: [...state.activeEffects, effect],
          }));
        },

        removeEffect: (effectId: string) => {
          set((state) => {
            // Clear timeout for the effect being removed
            const effectToRemove = state.activeEffects.find(
              (effect) => effect.id === effectId,
            );

            if (effectToRemove?.timeoutId) {
              clearTimeout(effectToRemove.timeoutId);
            }

            return {
              activeEffects: state.activeEffects.filter(
                (effect) => effect.id !== effectId,
              ),
            };
          });
        },

        updateEffects: () => {
          const now = Date.now();

          set((state) => ({
            activeEffects: state.activeEffects.map((effect) => ({
              ...effect,
              isActive: now - effect.startTime < effect.duration,
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
          activeEffects.forEach((effect) => {
            const isStillActive = now - effect.startTime < effect.duration;

            if (!isStillActive) return;

            switch (effect.type) {
              case "mining_efficiency":
                multipliers.miningEfficiency = Math.max(
                  multipliers.miningEfficiency,
                  effect.multiplier,
                );
                break;
              case "crafting_speed":
                multipliers.craftingSpeed = Math.max(
                  multipliers.craftingSpeed,
                  effect.multiplier,
                );
                break;
              case "experience_boost":
                multipliers.experienceBoost = Math.max(
                  multipliers.experienceBoost,
                  effect.multiplier,
                );
                break;
              case "resource_yield":
                multipliers.resourceYield = Math.max(
                  multipliers.resourceYield,
                  effect.multiplier,
                );
                break;
            }
          });

          return multipliers;
        },

        // Calculate tiered benefit based on total items used
        getTieredBenefit: (itemsUsed: number) => {
          if (itemsUsed >= 101) return 1.7; // 70% benefit
          if (itemsUsed >= 41) return 1.5; // 50% benefit
          if (itemsUsed >= 26) return 1.35; // 35% benefit
          if (itemsUsed >= 11) return 1.2; // 20% benefit
          if (itemsUsed >= 5) return 1.1; // 10% benefit
          if (itemsUsed >= 1) return 1.03; // 3% benefit

          return 1.0; // No benefit
        },

        clearExpiredEffects: () => {
          const now = Date.now();

          set((state) => ({
            activeEffects: state.activeEffects.filter(
              (effect) => now - effect.startTime < effect.duration,
            ),
          }));
        },

        // Restart timeouts for active effects (used after hydration)
        restartTimeouts: () => {
          set((state) => ({
            activeEffects: restartEffectTimeouts(
              state.activeEffects,
              get().removeEffect,
            ),
          }));
        },

        // Reset all item effects and total items used
        reset: () => {
          set((state) => {
            // Clear all timeouts before resetting
            state.activeEffects.forEach((effect) => {
              if (effect.timeoutId) {
                clearTimeout(effect.timeoutId);
              }
            });

            return {
              activeEffects: [],
              totalItemsUsed: 0,
            };
          });
        },
      }),
      {
        name: "item-effects-storage",
        version: 1,
        // Restart timeouts after hydration
        onRehydrateStorage: () => (state) => {
          if (state) {
            // Clear expired effects first, then restart timeouts for remaining active effects
            state.clearExpiredEffects();
            state.restartTimeouts();
          }
        },
      },
    ),
    { name: "ItemEffectsStore" },
  ),
);

// Export reset function for external use
export const resetItemEffectsStore = () => {
  useItemEffectsStore.getState().reset();
  // Also clear the persisted storage (only in browser environment)
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.removeItem("item-effects-storage");
  }
};
