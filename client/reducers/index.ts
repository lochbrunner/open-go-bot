import {combineReducers, Reducer} from 'redux';
import navigator from './navigator';
import game from './game';
import displaySettings from './display-settings';

export default combineReducers<RootState>({
  navigator, game, displaySettings
});
