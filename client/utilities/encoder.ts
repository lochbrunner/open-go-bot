
/**
 * Features are hot encodes: Means 0: false, 1: true
 */
export interface Feature {
  own: number;
  opponent: number;
  empty: number;
  oneLiberty: number;
  twoLiberties: number;
  threeLiberties: number;
  fourLiberties: number;
  moreLiberties: number;
  lastMove: number;
}

export function createNamedFeatures(game: Game): Feature[] {
  return game.field.map((cell, i) => {
    const x = i % game.info.size;
    const y = Math.floor(i / game.info.size);

    const {turn} = game;
    const opponent = turn === 'black' ? 'white' : 'black';

    return {
      own: cell.stone === turn ? 1 : 0,
      opponent: cell.stone === opponent ? 1 : 0,
      empty: cell.stone === 'empty' ? 1 : 0,
      oneLiberty: cell.liberties === 1 ? 1 : 0,
      twoLiberties: cell.liberties === 2 ? 1 : 0,
      threeLiberties: cell.liberties === 3 ? 1 : 0,
      fourLiberties: cell.liberties === 4 ? 1 : 0,
      moreLiberties: cell.liberties > 4 ? 1 : 0,
      lastMove:
          game.lastMove && game.lastMove.x === x && game.lastMove.y === y ? 1 :
                                                                            0
    };
  });
}

function make2d<T>(input: T[], edgeLength: number): T[][] {
  const output: T[][] = [];
  const t = input;
  while (t.length) output.push(t.splice(0, edgeLength));
  return output;
}

export function createFeatures(game: Game): TrainingsData['features'][0] {
  return make2d(
      game.field.map((cell, i) => {
        const x = i % game.info.size;
        const y = Math.floor(i / game.info.size);

        const {turn} = game;
        const opponent = turn === 'black' ? 'white' : 'black';

        return [
          cell.stone === turn ? 1 : 0, cell.stone === opponent ? 1 : 0,
          cell.stone === 'empty' ? 1 : 0, cell.liberties === 1 ? 1 : 0,
          cell.liberties === 2 ? 1 : 0, cell.liberties === 3 ? 1 : 0,
          cell.liberties === 4 ? 1 : 0, cell.liberties > 4 ? 1 : 0,
          game.lastMove && game.lastMove.x === x && game.lastMove.y === y ? 1 :
                                                                            0
        ];
      }),
      19);
}

export function createLabel(game: Game): TrainingsData['labels'][0] {
  return game.field.map((cell, i) => {
    const x = i % game.info.size;
    const y = Math.floor(i / game.info.size);
    return game.nextMove && game.nextMove.x === x && game.nextMove.y === y ? 1 :
                                                                             0;
  });
}