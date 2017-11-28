import { handleActions } from 'redux-actions';
import * as immutlable from 'immutable';
import * as _ from 'lodash';
import * as Actions from '../constants/actions';
import { ActionPayload } from '../actions/game';

class EmptyCell implements Cell {
    stone: 'black' | 'white' | 'empty';
    liberties: number;
    forbidden: boolean;

    constructor() {
        this.forbidden = false;
        this.liberties = 0;
        this.stone = 'empty';
    }
}

const initialRecord = immutlable.Record({
    field: immutlable.List(_.range(19 * 19).map(
        i => new EmptyCell())),
    turn: 'black',
    groups: []
});

const initialState = new initialRecord();

function parsePosString(posString: string): { x: number, y: number } {
    const coords = posString.split('x');
    const x = parseInt(coords[0]);
    const y = parseInt(coords[1]);
    return { x, y };
}

function calcLiberties(state: immutlable.Map<string, any>,
    action: ActionPayload): immutlable.Map<string, any> {
    const nextPlayer = action.player === 'white' ? 'black' : 'white';
    const fieldWidth = state.get('width');
    const { x, y } = action.pos;
    const i = x + y * action.fieldWidth;
    const oldCell = state.getIn(['field', i]);
    const groups = state.get('groups') as Group[];
    const posString = `${x}x${y}`;
    // Extend an group?
    const ownGroups = groups.map((group, i) => _.merge(group, { i })).filter(group => group.player === nextPlayer &&
        group.liberties[posString]) as (Group & { i: number })[];

    const otherGroups = groups.filter(group => group.player !== nextPlayer &&
        group.liberties[posString]) as (Group & { i: number })[];
    if (otherGroups.length > 0) {
        // Decrease nearby oponents groups liberties or remove the whole group if it is dead
        let rmGroups: (Group & { i: number })[] = [];
        otherGroups.forEach((group) => {
            _.keysIn(group.items)
                .forEach(stone => {
                    const { x, y } = parsePosString(stone);
                    const j = x + y * action.fieldWidth;
                    const oldCell = state.getIn(['field', j]);
                    oldCell.liberties--;
                    // Group is dead?
                    if (oldCell.liberties === 0) {
                        rmGroups.push(group);
                        console.log(`Group index to delete ${group.i}`);
                    }
                    else {
                        state = state.setIn(['field', j], oldCell);
                    }
                });
        });
        let catchedStones = 0;
        rmGroups.forEach(removingGroup => {
            const neighboringGroups = {};
            _.keysIn(removingGroup.items).forEach(stone => {
                const {x,y} = parsePosString(stone);
                const j = x + y * action.fieldWidth;
                catchedStones++;
                state = state.setIn(['field', j], new EmptyCell());
                // Increase the liberty of the neighboring groups
                groups.forEach((group, groupId) => {
                    if(group.liberties[stone]) {
                        console.log(`Found neighbor group ${groupId}`);
                        neighboringGroups[groupId.toString()] = true;
                    }
                });
            });
            console.log(neighboringGroups);
            groups.splice(removingGroup.i, 1);
        });
        console.log(`Player ${action.player} catched ${catchedStones} stones.`);
    }

    if (ownGroups.length === 0) {
        // Create a new group
        const group:
            Group = { player: nextPlayer, items: { [posString]: true }, liberties: {} };
        let libCount = 0;
        if (x > 0) {
            if(state.getIn(['field', x - 1 + y * action.fieldWidth]).stone === 'empty')
                group.liberties[`${x - 1}x${y}`] = true;
            libCount++;
        }
        if (y > 0) {
            if(state.getIn(['field', x + (y - 1) * action.fieldWidth]).stone === 'empty')
                group.liberties[`${x}x${y - 1}`] = true;
            libCount++;
        }
        if (x < action.fieldWidth - 1) {
            if(state.getIn(['field', x + 1 + y * action.fieldWidth]).stone === 'empty')
                group.liberties[`${x + 1}x${y}`] = true;
            libCount++;
        }
        if (y < action.fieldHeight - 1) {
            if(state.getIn(['field', x + (y + 1) * action.fieldWidth]).stone === 'empty')
                group.liberties[`${x}x${y + 1}`] = true;
            libCount++;
        }

        if(libCount === 0) {
            console.warn('Suicide move');
            return state;
        }

        oldCell.stone = action.player;
        oldCell.liberties = libCount;
        groups.push(group);
        return state.setIn(['field', i], oldCell)
            .set('turn', nextPlayer)
            .set('groups', groups);
    }
    return state;
}

export default handleActions<immutlable.Map<string, any>, ActionPayload>({
    [Actions.SET_STONE]: (state, action) => {
        return calcLiberties(state, action.payload);
    }
}, initialState);