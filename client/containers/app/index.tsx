import * as React from 'react';

// import * as style from './style.scss';
// import * as scss from './style.scss';
// require('./style.scss');
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import * as GameActions from '../../actions/game';
import * as DisplayActions from '../../actions/display-settings';

import { Board } from '../../components/board';
import { CheckButton } from '../../components/check-button';

require('./index.scss');

export namespace App {
    export interface Props extends RouteComponentProps<void> {

        dispatch: (action: any) => void;
        state: RootState;
        actions: {
            game: typeof GameActions;
            displaySettings: typeof DisplayActions;
        }
    }

    export interface State {
        /* empty */
    }
}

@connect(mapStateToProps, mapDispatchToProps as any)
export class App extends React.Component<App.Props, App.State> {

    render(): React.ReactNode {
        const { state, actions, children } = this.props;
        const appStyle = {
            width: '800px',
            margin: 'auto'
        };
        const displaySettings = {
            display: 'inline-block', 
            float: 'right', 
            margin:'20px'
        };
        
        return (
            <div style={appStyle}>
                <Board gameActions={actions.game} boardSize={(state.settings as any).get('board')} game={state.game} displaySettings={state.displaySettings} />
                <div style={displaySettings}>
                    <CheckButton onSwitched={actions.displaySettings.toggleLibertiesView} checked={(state.displaySettings as any).get('showLiberties')}>Liberties</CheckButton>
                </div>
                {children}
            </div>
        );
    }
}

function mapStateToProps(state: RootState) {
    return {
        state
    };
}

function mapDispatchToProps(dispatch): Partial<App.Props> {
    return {
        actions: {
            game: bindActionCreators(GameActions, dispatch),
            displaySettings: bindActionCreators(DisplayActions, dispatch)
        }
    };
}
