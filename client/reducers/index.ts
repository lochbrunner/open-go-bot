import {combineReducers, Reducer} from 'redux';
import navigator from './navigator';
import game from './game';
import displaySettings from './display-settings';
import training from './training';

export default combineReducers<RootState>({
  navigator, game, displaySettings, training
});
