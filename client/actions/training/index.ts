import {createAction} from 'redux-actions';

import * as Actions from '../../constants/actions';
import {Progress} from '../../utilities/progress';

import trainOnRecords from './train';

export const updateTrainingsProgress =
    createAction<Progress>(Actions.UPDATE_TRAINING_PROGRESS);

export const updateWeights = createAction<Model.Graph>(Actions.UPDATE_WEIGHTS);

export const train = (graph: Model.Graph) => {
  return dispatch => trainOnRecords(dispatch, graph);
};