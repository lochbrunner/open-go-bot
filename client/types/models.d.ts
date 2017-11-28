declare interface NavigationState {
    step: number;
}

declare interface Settings {
    boardSize: {width: number, height: number};
}

declare interface DisplaySettings {
    showLiberties: boolean;
}

declare type Player = 'black' | 'white';

declare interface Cell {
    stone: Player | 'empty';
    liberties: number; // 0 means empty field
    forbidden: boolean;
}

declare interface Group {
    player: Player;
    items: {[pos: string]: boolean};
    liberties: {[pos: string]: boolean};
}

declare interface Game {
    field: Cell[];
    turn: Player;

    groups: Group[];
}

declare interface RootState
{
    navigation: NavigationState;
    settings: Settings;

    game: Game;

    displaySettings: DisplaySettings;
}