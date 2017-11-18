import { combineReducers, Reducer } from 'redux';
import navigator from './navigator';
import settings from './settings';
import game from './game';

// export interface RootState {
    
// }

export default combineReducers<RootState>({
    navigator,
    settings,
    game
});
