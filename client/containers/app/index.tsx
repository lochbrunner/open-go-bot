import * as React from 'react';

// import * as style from './style.scss';
// import * as scss from './style.scss';
// require('./style.scss');
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { Board } from '../../components/board';
import * as GameActions from '../../actions/game';

export namespace App {
    export interface Props extends RouteComponentProps<void> {

        dispatch: (action: any) => void;
        state: RootState;
        actions: {
            game: typeof GameActions;
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
        return (
            <div>
                <Board gameActions={actions.game} boardSize={(state.settings as any).get('board')} game={state.game} />
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
            game: bindActionCreators(GameActions, dispatch)
        }
    };
}
