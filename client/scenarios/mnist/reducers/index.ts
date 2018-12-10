import * as _ from 'lodash';
import {Action} from 'redux-actions';

import * as Actions from '../actions';
import * as Constants from '../actions/constants';

export const reducers =
    (state: RootState, action: Action<Actions.ActionPayload>): RootState => {
      if (action.type === Constants.MNIST_UPDATE_IMAGE) {
        const updateImageAction =
            action as Action<Actions.ActionUpdateImagePayload>;
        return {
          ...state,
          mnist: {
            ...state.mnist,
            caret: updateImageAction.payload.caret,
            currentInput: {pixels: updateImageAction.payload.pixels},
            groundTruth: updateImageAction.payload.groundTruth.toString(),
            prediction: undefined
          }
        };
      } else if (action.type === Constants.MNIST_UPDATE_PIXEL) {
        const updateImageAction =
            action as Action<Actions.ActionUpdatePixelPayload>;
        const {payload} = updateImageAction;

        const newPixels = state.mnist.currentInput.pixels.slice();

        newPixels[payload.y] = newPixels[payload.y].slice();
        newPixels[payload.y][payload.x] = payload.value;
        return {
          ...state,
          mnist: {
            ...state.mnist,
            currentInput: {pixels: newPixels},
            groundTruth: '-',
            prediction: undefined
          }
        };
      } else if (action.type === Constants.MNIST_CLEAR_IMAGE) {
        return {
          ...state,
          mnist: {
            ...state.mnist,
            currentInput: {pixels: _.times(28).map(r => _.times(28, c => 0))},
            groundTruth: '-',
            prediction: undefined
          }
        };
      } else if (action.type === Constants.MNIST_LOAD_TRAINING_DATA_FINISHED) {
        return {...state, mnist: {...state.mnist, hasLoaded: true}};
      } else if (action.type === Constants.MNIST_UPDATE_PREDICTION) {
        const payload = action.payload as Actions.ActionUpdatePrediction;
        // TODO: Refactor
        // Update graph activations
        const newNodes = state.graph.nodes.map(c => {
          if (payload.activations.has(c.node.id))
            (c.node as Model.OperationNode).activations =
                payload.activations.get(c.node.id);
          return c;
        });
        return {
          ...state,
          graph: {...state.graph, nodes: newNodes},
          mnist: {...state.mnist, prediction: payload}
        };
      } else if (action.type === Constants.MNIST_TOGGLE_AUTO_PREDICT) {
        const payload = action.payload as Actions.ToggleAutoPredictPayload;
        return {
          ...state,
          mnist: {...state.mnist, autoPredict: payload.nextValue}
        };
      }
      return state;
    };