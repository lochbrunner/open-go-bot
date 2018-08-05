import * as _ from 'lodash';
import {parse} from 'smartgame';
import * as wu from 'wu';

import {ActionPayload, TurnPayload} from '../../actions/game';

class EmptyCell implements Cell {
  stone: 'black'|'white'|'empty';
  liberties: number;
  forbidden?: Player|'both';
  isLiberty: boolean;
  occupiedAdjacentCells?: number;
  constructor() {
    this.forbidden = undefined;
    this.isLiberty = false;
    this.liberties = 0;
    this.stone = 'empty';
  }
}

class EmptyLibertyCell implements LibertyCell {
  adjacentGroups: Group[];
  occupiedAdjacentCells: number;
  forbidden?: Player|'both';

  constructor() {
    this.adjacentGroups = new Array(4);
    this.occupiedAdjacentCells = 0;
  }
}

export class EmptyGame implements Game {
  lastMove: Vector2d;
  /**
   * -1 indecates a live game
   */
  currentStep: number;
  info: GameInfo;
  steps: Step[];
  field: Cell[];
  turn: Player;
  cache: GameCache;
  capturedStones: {black: number; white: number;};
  constructor() {
    this.field = _.range(19 * 19).map(i => new EmptyCell());
    this.turn = 'black';
    this.cache = {groups: [], libertyCells: new Map()};
    this.capturedStones = {black: 0, white: 0};
    this.info = {
      title: 'New Game',
      opponents: {white: 'Human', black: 'Human'},
      date: new Date(),
      komi: 6.5,
      size: 19
    };
    this.steps = [];
    this.currentStep = -1;
  }
}

function assert(condition) {
  if (!condition) {
    console.error('Debug Assert');
  }
}

function oponent(player: Player): Player {
  return player === 'white' ? 'black' : 'white';
}

type CellIdCreator = (x: number, y: number) => number;
type Direction = 'up'|'down'|'left'|'right';
const allDirections: Direction[] = ['up', 'down', 'left', 'right'];

function direction2Vector(direction?: Direction): number[] {
  switch (direction) {
    case 'left':
      return [-1, 0];
    case 'up':
      return [0, -1];
    case 'right':
      return [1, 0];
    case 'down':
      return [0, 1];
    default:
      return [0, 0];
  }
}

function idPlusDir(
    fieldWidth: number, sourceId: number, direction?: Direction): number {
  const x = sourceId % fieldWidth;
  const y = Math.floor(sourceId / fieldWidth);
  const [offX, offY] = direction2Vector(direction);
  return createCellId(fieldWidth, x + offX, y + offY);
}

function evalPosition(
    fieldWidth: number, x: number, y: number, direction?: Direction): boolean {
  const [offX, offY] = direction2Vector(direction);
  x += offX;
  y += offY;
  if (x < 0) return false;
  if (y < 0) return false;
  if (x > fieldWidth - 1) return false;
  if (y > fieldWidth - 1) return false;
  return true;
}

function revertDirection(direction: Direction): Direction {
  const map: {[orig: string]: Direction} =
      {'left': 'right', 'up': 'down', 'right': 'left', 'down': 'up'};
  return map[direction];
}

function direction2Id(direction: Direction) {
  return {'left': 0, 'up': 1, 'right': 2, 'down': 3}[direction];
}

function createCellId(
    fieldWidth: number, x: number, y: number, off?: Direction): number {
  if (createCellId) {
    switch (off) {
      case 'up':
        if (y < 1) return -1;
        return x + (y - 1) * fieldWidth;
      case 'left':
        if (x < 1) return -1;
        return x - 1 + y * fieldWidth;
      case 'down':
        if (y === fieldWidth - 1) return -1;
        return x + (y + 1) * fieldWidth;
      case 'left':
        if (x === fieldWidth - 1) return -1;
        return x + 1 + y * fieldWidth;
    }
  }
  return x + y * fieldWidth;
}

function checkSuicide(
    libertyCell: LibertyCell, fieldWidth: number, pos: number): void {
  const x = pos % fieldWidth;
  const y = Math.floor(pos / fieldWidth);
  const libs = {};
  let maxLibs = 4;
  if (x === 0) maxLibs--;
  if (y === 0) maxLibs--;
  if (x === fieldWidth - 1) maxLibs--;
  if (y === fieldWidth - 1) maxLibs--;
  libs['black'] = maxLibs;
  libs['white'] = maxLibs;

  libertyCell.adjacentGroups.reduce((prev, group) => {
    if (group.color === 'black') {
      libs['black'] += group.adjacentLibertyCells.size - 1;
      libs['white']--;
    } else if (group.color === 'white') {
      libs['white'] += group.adjacentLibertyCells.size - 1;
      libs['black']--;
    }
    return prev;
  }, libs);

  if (libs['black'] === 0)
    libertyCell.forbidden = 'black';
  else if (libs['white'] === 0)
    libertyCell.forbidden = 'white';
  else
    libertyCell.forbidden = undefined;
}

/**
 * The liberties from the source get not deleted here
 */
function moveLiberties(
    target: Group, source: Group, libertyCells: Map<number, LibertyCell>) {
  source.adjacentLibertyCells.forEach(lib => {
    target.adjacentLibertyCells.add(lib);
    for (let i = 0; i < 4; ++i) {
      if (libertyCells.get(lib).adjacentGroups[i] === source)
        libertyCells.get(lib).adjacentGroups[i] = target;
    }
  });
}

function createLiberty(
    fieldWidth: number, cellId: number, group: Group,
    libertyCells: Map<number, LibertyCell>, direction: Direction) {
  const dirId = direction2Id(revertDirection(direction));
  if (libertyCells.get(cellId)) {
    const existingLibertyCell = libertyCells.get(cellId);
    // Not the same group again?
    if (existingLibertyCell.adjacentGroups[dirId] !== group) {
      existingLibertyCell.adjacentGroups[dirId] = group;
      group.adjacentLibertyCells.add(cellId);
    }
    existingLibertyCell.occupiedAdjacentCells =
        existingLibertyCell.adjacentGroups.reduce(
            (sum, g) => sum + (g !== undefined ? 1 : 0), 0);
    checkSuicide(existingLibertyCell, fieldWidth, cellId);
  } else {
    group.adjacentLibertyCells.add(cellId);
    const adjacentGroups: Group[] = new Array(4);
    adjacentGroups[dirId] = group;
    libertyCells.set(cellId, {adjacentGroups, occupiedAdjacentCells: 1});
  }
}

function killGroup(
    groups: Group[], libertyCells: Map<number, LibertyCell>,
    capturedStones: {black: number, white: number}, groupToKill: Group,
    fieldWidth: number) {
  capturedStones[oponent(groupToKill.color)] += groupToKill.stones.size;
  const groupId = groups.indexOf(groupToKill);
  groups.splice(groupId, 1);

  // Create Fieldmap
  const groupsOnField = new Map<number, Group>();
  groups.forEach(
      group => group.stones.forEach(stone => groupsOnField.set(stone, group)));

  groupToKill.stones.forEach(stone => {
    // Surrounded by any other group?
    type GroupInfo = {group: Group, dir: Direction};
    const nearGroups: GroupInfo[] = [];
    for (let dir of allDirections) {
      const id = idPlusDir(fieldWidth, stone, dir);
      if (id === -1) continue;
      nearGroups.push({group: groupsOnField.get(id), dir});
    }
    if (nearGroups.length > 0) {
      const lib = new EmptyLibertyCell();
      _.uniqBy(nearGroups.filter(info => info.group), info => info.group)
          .forEach(group => {
            group.group.adjacentLibertyCells.add(stone);
            const dirId = direction2Id(revertDirection(group.dir));
            lib.adjacentGroups[dirId] = group.group;
          });
      libertyCells.set(stone, lib);
    }
  });
}

function deleteLiberty(
    cellId: number, fieldWidth: number, libertyCells: Map<number, LibertyCell>,
    killer: (group: Group) => void) {
  const libertyCell = libertyCells.get(cellId);

  if (libertyCell) {
    libertyCell.adjacentGroups.forEach(
        group => group.adjacentLibertyCells.delete(cellId));
    libertyCells.delete(cellId);
    libertyCell.adjacentGroups.forEach(group => {
      if (group.adjacentLibertyCells.size === 0) killer(group);
    });
  }
}

function addLibertiesArroundExpandedGroup(
    x, y, fieldWidth, libertyCells: Map<number, LibertyCell>, group: Group,
    oponentGroups: Group[]) {
  const createCellId = (x: number, y: number) => x + y * fieldWidth;
  for (let dir of allDirections) {
    const [offX, offY] = direction2Vector(dir);
    const cellId = createCellId(x + offX, y + offY);
    if (evalPosition(fieldWidth, x + offX, y + offY) &&
        !group.stones.has(cellId) &&
        oponentGroups.reduce(
            (prev, group) => prev && !group.stones.has(cellId), true))
      createLiberty(fieldWidth, cellId, group, libertyCells, dir);
  }
}

function createNewGroup(
    color: Player, x: number, y: number, fieldWidth: number,
    libertyCells: Map<number, LibertyCell>) {
  const createCellId = (x: number, y: number) => x + y * fieldWidth;
  const group: Group = {
    color,
    stones: new Set<number>(),
    adjacentLibertyCells: new Set<number>()
  };
  group.stones.add(x + y * fieldWidth);
  for (let dir of allDirections) {
    if (evalPosition(fieldWidth, x, y, dir)) {
      const [offX, offY] = direction2Vector(dir);
      createLiberty(
          fieldWidth, createCellId(x + offX, y + offY), group, libertyCells,
          dir);
    }
  }
  return group;
}

function calculatePremission(
    fieldWidth: number, x: number, y: number, field: Cell): Player|'both'|
    undefined {
  const createId = (x: number, y: number) => x + y * fieldWidth;
  const libs = {};
  let maxLibs = 4;
  if (x === 0) maxLibs--;
  if (y === 0) maxLibs--;
  if (x === fieldWidth - 1) maxLibs--;
  if (y === fieldWidth - 1) maxLibs--;
  libs['black'] = maxLibs;
  libs['white'] = maxLibs;
  if (x > 0 && field[createId(x - 1, y)].stone !== 'empty')
    libs[oponent(field[createId(x - 1, y)].stone)]--;
  if (y > 0 && field[createId(x, y - 1)].stone !== 'empty')
    libs[oponent(field[createId(x, y - 1)].stone)]--;
  if (x < fieldWidth - 1 && field[createId(x + 1, y)].stone !== 'empty')
    libs[oponent(field[createId(x + 1, y)].stone)]--;
  if (y < fieldWidth - 1 && field[createId(x, y + 1)].stone !== 'empty')
    libs[oponent(field[createId(x, y + 1)].stone)]--;
  return libs['black'] === 0 ? 'black' :
                               libs['white'] === 0 ? 'white' : undefined;
}

function createField(cache: GameCache): Cell[] {
  const emptyField: Cell[] = _.range(19 * 19).map(i => new EmptyCell());
  const fieldWithStones = cache.groups.reduce((field, group) => {
    const groupLiberties = group.adjacentLibertyCells.size;
    group.stones.forEach((value, key) => {
      field[key] = {
        stone: group.color,
        forbidden: 'both',
        isLiberty: false,
        liberties: groupLiberties
      };
    });

    return field;
  }, emptyField);
  return wu(cache.libertyCells.entries()).reduce((field, [id, libCell]) => {
    field[id].isLiberty = true;
    field[id].forbidden = libCell.forbidden;
    // libCell.occupiedAdjacentCells === 4 ? 'both' : undefined;
    field[id].occupiedAdjacentCells = libCell.adjacentGroups.reduce(
        (prev, group) => prev + (group ? 1 : 0), 0);
    return field;
  }, fieldWithStones);
}

export function putStone(state: Game, action: TurnPayload): Game {
  const nextPlayer = oponent(action.player);
  const {size} = state.info;
  const {x, y} = action.pos;
  const {groups, libertyCells} = state.cache;
  const createCellId = (x: number, y: number) => x + y * size;
  const currentCellId = createCellId(x, y);
  const killer = (group: Group) =>
      killGroup(groups, libertyCells, state.capturedStones, group, size);

  // Are there nearby groups?
  const libertyCell = libertyCells.get(currentCellId);
  const oponentGroups = libertyCell ? _.uniq(libertyCell.adjacentGroups.filter(
                                          g => g.color !== action.player)) :
                                      [];
  const ownGroups = libertyCell ? _.uniq(libertyCell.adjacentGroups.filter(
                                      g => g.color === action.player)) :
                                  [];
  if (ownGroups.length > 0) {
    if (ownGroups.length > 1) {
      // Delete and deregister old groups
      ownGroups.slice(1).forEach(group => {
        group.stones.forEach(stone => ownGroups[0].stones.add(stone));
        moveLiberties(ownGroups[0], group, libertyCells);
        const gId = state.cache.groups.indexOf(group);
        state.cache.groups.splice(gId, 1);
      });
    }
    // Remove the liberty and add new one
    ownGroups[0].stones.add(currentCellId);
    addLibertiesArroundExpandedGroup(
        x, y, size, libertyCells, ownGroups[0], oponentGroups);
    deleteLiberty(currentCellId, size, libertyCells, killer);

  } else {
    // Create new Group
    const group: Group = {
      adjacentLibertyCells: new Set(),
      color: action.player,
      stones: new Set([currentCellId])
    };
    state.cache.groups.push(group);
    if (libertyCell) {
      deleteLiberty(currentCellId, size, libertyCells, killer);
    }
    addLibertiesArroundExpandedGroup(
        x, y, size, libertyCells, group, oponentGroups);
    // Create new liberty Cells
    state.turn = oponent(action.player);
  }

  return {
    turn: oponent(action.player),
    currentStep: state.currentStep,
    cache: state.cache,
    field: createField(state.cache),
    capturedStones: {...state.capturedStones},
    info: {...state.info},
    steps: state.steps,
    lastMove: action.pos
  };
}

function convertSgfPos(pos: string): Vector2d {
  // Hopefully the next three lines get cached by the compiler optimizer...
  const startLetter = 'a'.charCodeAt(0);
  const legendLetters = _.range(0, 19).map(
      i => String.fromCharCode(i + startLetter));  // Remove 'I';
  const dict = _.fromPairs(legendLetters.map((c, i) => [c, i]));
  const x = dict[pos[0]];
  const y = dict[pos[1]];
  return {x, y};
}

function convertSgfPlayer(player: string): Player {
  const dict: {[sgf: string]: Player} = {'B': 'black', 'W': 'white'};
  return dict[player];
}

export function loadGame(state: Game, sgf: string): Game {
  const gameTree: string[][] = parse(sgf).gameTrees[0].nodes;
  const config = gameTree.splice(0, 1)[0];
  state = new EmptyGame();

  state.steps = gameTree.map(turn => {
    const [player, pos] = _.toPairs(turn)[0];
    return {player: convertSgfPlayer(player), pos: convertSgfPos(pos)};
  });

  state.info = {
    title: config['EV'] || 'Loaded game',
    opponents: {black: config['PB'] || 'Black', white: config['PW'] || 'White'},
    komi: parseFloat(config['KM'] || '6.5'),
    date: config['DT'] ? new Date(config['DT']) : new Date(),
    size: parseFloat(config['SZ'] || '19'),
  };
  state.currentStep = 0;
  state.nextMove = state.steps[state.currentStep].pos;
  return state;
}

export function nextStep(state: Game) {
  const action: TurnPayload = {...state.steps[state.currentStep++]};
  const nextState = putStone(state, action);
  nextState.nextMove = state.steps[state.currentStep] ?
      state.steps[state.currentStep].pos :
      undefined;
  return nextState;
}