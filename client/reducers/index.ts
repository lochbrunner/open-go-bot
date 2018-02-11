import {combineReducers, Reducer} from 'redux';
import game from './game';
import displaySettings from './display-settings';
import training from './training';

export default combineReducers<RootState>({
  game, displaySettings, training
});
