
export interface WeightUpdateInfo {
  nodeId: string;
  values: number[];
}

export interface Progress {
  description: string;
  progress: {finished: number, total: number};
  newWeights: WeightUpdateInfo[];
}