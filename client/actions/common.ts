export type ChunkActionType1<T1> = (arg1: T1) =>
    (dispatch: (action: any) => void) => void;

export type ChunkActionType2<T1, T2> = (arg1: T1, arg2: T2) =>
    (dispatch: (action: any) => void) => void;