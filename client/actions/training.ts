import {createAction} from 'redux-actions';
import * as Actions from '../constants/actions';
import {TrainingProgress} from '../training/load';
export const loadData = createAction(Actions.LOAD_DATA);

export const updateProgress =
    createAction<TrainingProgress>(Actions.UPDATE_LOADING_PROGRESS);
