import {Action} from 'redux-actions';
import * as Actions from '../actions';
import * as Constants from '../actions/constants';

export const reducers =
    (state: RootState, action: Action<Actions.ActionPayload>): RootState => {
      if (action.type === Constants.UPDATE_IMAGE) {
        const updateImageAction =
            action as Action<Actions.ActionUpdateImagePayload>;
        return {
          ...state,
          mnist: {currentInput: {pixels: updateImageAction.payload.pixels}}
        };
      } else if (action.type === Constants.UPDATE_PIXEL) {
        const updateImageAction =
            action as Action<Actions.ActionUpdatePixelPayload>;
        const {payload} = updateImageAction;

        const newPixels = state.mnist.currentInput.pixels.slice();

        newPixels[payload.x] = newPixels[payload.x].slice();
        newPixels[payload.x][payload.y] = payload.value;
        return {...state, mnist: {currentInput: {pixels: newPixels}}};
      }
      return state;
    };