// Credit costs for different features
export const CREDIT_COSTS = {
  // Basic Tools
  sharpen: 1,
  colorCorrection: 1,
  
  // Effects
  oilPainting: 2,
  sketch: 2,
  vintage: 2,
  hdr: 3,
  
  // Interactive Tools
  interactiveCrop: 1,
  addText: 1,
  
  // AI Features
  removeBackground: 3,
  depthMap: 10,
  upscale: 3,
  
  // Advanced Features
  vectorize: 4,
  jigsawPuzzle: 5,
  sliceImages: 3,
} as const;

export type FeatureKey = keyof typeof CREDIT_COSTS;

// Helper function to get credit cost
export function getCreditCost(feature: FeatureKey): number {
  return CREDIT_COSTS[feature];
}

// Helper function to format credit cost for display
export function formatCreditCost(cost: number): string {
  return `${cost} credit${cost > 1 ? 's' : ''}`;
}
