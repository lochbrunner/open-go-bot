import {handleActions} from 'redux-actions';
import * as Actions from '../constants/actions';
import {ActionPayload, TurnPayload} from '../actions/game';
import {loadGame, EmptyGame, putStone, nextStep} from '../utilities/game-logic';

export default handleActions<Game, ActionPayload>({
  [Actions.SET_STONE]: (
      state, action) => putStone(state, (action).payload as TurnPayload),
             [Actions.RESET_GAME]: (state,
                                    action) => { return new EmptyGame(); },
             [Actions.LOAD_GAME]: (state, action) =>
                 loadGame(state, (action.payload as string)),
             [Actions.STEP_FORWARD]: nextStep
}, new EmptyGame());