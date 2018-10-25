import {Action} from 'redux-actions';
import * as Actions from '../actions';
import * as Constants from '../actions/constants';
import _ = require('lodash');

export const reducers =
    (state: RootState, action: Action<Actions.ActionPayload>): RootState => {
      if (action.type === Constants.UPDATE_IMAGE) {
        const updateImageAction =
            action as Action<Actions.ActionUpdateImagePayload>;
        return {
          ...state,
          mnist: {
            ...state.mnist,
            caret: updateImageAction.payload.caret,
            currentInput: {pixels: updateImageAction.payload.pixels}
          }
        };
      } else if (action.type === Constants.UPDATE_PIXEL) {
        const updateImageAction =
            action as Action<Actions.ActionUpdatePixelPayload>;
        const {payload} = updateImageAction;

        const newPixels = state.mnist.currentInput.pixels.slice();

        newPixels[payload.x] = newPixels[payload.x].slice();
        newPixels[payload.x][payload.y] = payload.value;
        return {
          ...state,
          mnist: {...state.mnist, currentInput: {pixels: newPixels}}
        };
      } else if (action.type === Constants.CLEAR_IMAGE) {
        return {
          ...state,
          mnist: {
            ...state.mnist,
            currentInput: {pixels: _.times(28).map(r => _.times(28, c => 0))}
          }
        };
      } else if (action.type === Constants.MNIST_LOAD_TRAINING_DATA_FINISHED) {
        return {...state, mnist: {...state.mnist, hasLoaded: true}};
      }
      return state;
    };