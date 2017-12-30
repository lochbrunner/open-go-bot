import * as React from 'react';
import { CheckButton } from './check-button';
import { Button } from './button';
import { FileButton } from './file-button';
import * as GameActions from '../actions/game';
import * as DisplayActions from '../actions/display-settings';

export namespace Menu {

  export interface Props extends React.HTMLProps<HTMLButtonElement> {
    state: RootState;

    gameActions: typeof GameActions;
    displaySettingsActions: typeof DisplayActions;
  }

  export interface State {
  }
}

export class Menu extends React.Component<Menu.Props, Menu.State> {
  render(): React.ReactNode {
    const { state, children, gameActions, displaySettingsActions } = this.props;

    const displaySettings = {
      display: 'inline-block',
      margin: '20px'
    };

    return <div style={displaySettings}>
      <CheckButton onSwitched={displaySettingsActions.toggleLibertiesView} checked={(state.displaySettings as any).get('showLiberties')}>Liberties Count</CheckButton>
      <CheckButton onSwitched={displaySettingsActions.toggleIsLibertyView} checked={(state.displaySettings as any).get('showIsLiberty')}>Is Liberty</CheckButton>
      <CheckButton onSwitched={displaySettingsActions.toggleForbiddenView} checked={(state.displaySettings as any).get('showForbidden')}>Forbidden Fields</CheckButton>
      <CheckButton onSwitched={displaySettingsActions.toggleNextMoveView} checked={(state.displaySettings as any).get('showNextMove')}>Move Preview</CheckButton>
      <Button onClicked={gameActions.resetGame}>New Game</Button>
      <FileButton onSelected={gameActions.loadGame}>Load Game</FileButton>
      <Button onClicked={gameActions.stepForward} disabled={state.game.currentStep === -1}>Next Step</Button>
    </div>;
  }
}