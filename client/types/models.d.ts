declare interface NavigationState {
    step: number;
}

declare interface Settings {
    boardSize: {width: number, height: number};
}

declare type Player = 'black' | 'white';

declare interface Cell {
    stone: Player | 'empty';
    forbidden: boolean;
}

declare interface Game {
    field: Cell[];
    turn: Player;
}

declare interface RootState
{
    navigation: NavigationState;
    settings: Settings

    game: Game;
}