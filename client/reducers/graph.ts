
// See
// https://stackoverflow.com/questions/40463060/turn-a-string-literal-type-to-a-literal-value
export type ActionTypes = {
  type: 'TEST',
  payload: {}
};

export const reducers: (state: RootState, action: ActionTypes) => RootState =
    (state: RootState, action: ActionTypes) => {
      if (action.type === 'TEST') {
        return state;
      }
      return state;
    };