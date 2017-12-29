/**
 * Features are hot encodes: Means 0: false, 1: true
 */
export interface Feature {
  black: number;
  white: number;
  empty: number;
  oneLiberty: number;
  twoLiberties: number;
  threeLiberties: number;
  fourLiberties: number;
  moreLiberties: number;
  lastMove: number;
}

export function createFeatures(game: Game): Feature[] {
  return game.field.map((cell, i) => {
    const x = i % game.info.size;
    const y = Math.floor(i / game.info.size);

    return {
      black: cell.stone === 'black' ? 1 : 0,
      white: cell.stone === 'white' ? 1 : 0,
      empty: cell.stone === 'empty' ? 1 : 0,
      oneLiberty: cell.liberties === 1 ? 1 : 0,
      twoLiberties: cell.liberties === 2 ? 1 : 0,
      threeLiberties: cell.liberties === 3 ? 1 : 0,
      fourLiberties: cell.liberties === 4 ? 1 : 0,
      moreLiberties: cell.liberties > 4 ? 1 : 0,
      lastMove: game.lastMove.x === x && game.lastMove.y === y ? 1 : 0
    };
  });
}