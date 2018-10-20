import * as React from 'react';
import { CheckButton } from '../../components/check-button';
import { Button } from '../../components/button';
import { FileButton } from '../../components/file-button';
import * as GoActions from './actions';

export namespace Menu {

  export interface Props extends React.HTMLProps<HTMLButtonElement> {
    go: Go;
    goActions: typeof GoActions;
  }

  export interface State {
  }
}

export class Menu extends React.Component<Menu.Props, Menu.State> {
  render(): React.ReactNode {
    const { go, goActions } = this.props;
    const { displaySettings } = go;

    const displaySettingsStyle = {
      display: 'inline-block',
      margin: '20px'
    };

    return <div style={displaySettingsStyle}>
      <CheckButton onSwitched={goActions.toggleLibertiesView} checked={displaySettings.showLiberties}>Liberties Count</CheckButton>
      <CheckButton onSwitched={goActions.toggleIsLibertyView} checked={displaySettings.showIsLiberty}>Is Liberty</CheckButton>
      <CheckButton onSwitched={goActions.toggleForbiddenView} checked={displaySettings.showForbidden}>Forbidden Fields</CheckButton>
      <CheckButton onSwitched={goActions.toggleNextMoveView} checked={displaySettings.showNextMove}>Move Preview</CheckButton>
      <Button onClicked={goActions.resetGame}>New Game</Button>
      <FileButton onSelected={goActions.loadGame}>Load Game</FileButton>
      <Button onClicked={goActions.stepForward} disabled={go.game.currentStep === -1}>Next Step</Button>
    </div>;
  }
}