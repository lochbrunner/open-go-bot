declare interface DisplaySettings {
  showLiberties: boolean;
  showIsLiberty: boolean;
  showForbidden: boolean;
  showNextMove: boolean;
}

declare type Player = 'black' | 'white';

declare interface Cell {
  stone: Player|'empty';
  liberties: number;  // 0 means empty field
  forbidden?: Player|'both';
  isLiberty: boolean;
  occupiedAdjacentCells?: number;
}

declare type BoardRange = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
    13 | 14 | 15 | 16 | 17 | 18;

declare interface Vector {
  x: BoardRange;
  y: BoardRange;
}

declare interface Group {
  color: Player;
  stones: Set<number>;
  /**
   * Used when the group gets destroyed
   * Key is the position e.g. 'x+y*width'
   */
  adjacentLibertyCells: Set<number>;
}

declare interface LibertyCell {
  /**
   * 0: left (-1,0) , 1: up (0,-1), 2: right (1,0), 3: down (0,1)
   */
  adjacentGroups: Group[];
  occupiedAdjacentCells: number;
  forbidden?: Player|'both';
}

declare interface GameCache {
  groups: Group[];
  /**
   * Key is the position e.g. 'x+y*width'
   */
  libertyCells: Map<number, LibertyCell>;
}

declare interface Vector2d {
  x: number;
  y: number;
}

declare interface Step { player: Player, pos: Vector2d }

declare interface GameInfo {
  title: string;
  opponents: {white: string, black: string};
  size: number;
  date?: Date;
  komi: number;
}

declare interface Game {
  nextMove?: Vector2d;
  lastMove?: Vector2d;
  steps: Step[];
  /**
   * -1 indecates a live game
   */
  currentStep: number;
  field: Cell[];
  turn: Player;
  cache: GameCache;
  capturedStones: {black: number, white: number};
  info: GameInfo;
}

declare interface TrainingsData {
  features: number[][][][];
  labels: number[][];  // sample * width * length * 1
}

declare interface Training {
  trainingsData: TrainingsData;
  training: {progress: {finished: number, total: number}, description: string};
}


declare namespace Model {
  interface Node {
    type: 'convolution'|'output'|'input'
    shape: number[]
  }

  interface Convolution extends Node {
    type: 'convolution';
    kernel: {size: number};
    filters: number;
    strides: number;
    weights: number[];
    activation: 'relu', outputs: Node[];
  }

  interface Input extends Node {
    type: 'input';
    legend: string[];
    outputs: Node[];
  }

  interface Convolution extends Node {
    type: 'convolution';
    kernel: {size: number};

    weights: number[];
    outputs: Node[];
  }
  interface Graph {
    input?: Input;
  }
}


declare interface RootState {
  game: Game;
  graph: Model.Graph

  displaySettings: DisplaySettings;
  training: Training;
}