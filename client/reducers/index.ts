import {combineReducers, Reducer} from 'redux';
import navigator from './navigator';
import settings from './settings';
import game from './game';
import displaySettings from './display-settings';

export default combineReducers<RootState>({
  navigator, settings, game, displaySettings
});
