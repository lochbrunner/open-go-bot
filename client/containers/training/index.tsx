import * as React from 'react';
import { withRouter } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';

require('./index.scss');

export namespace App {
  export interface Props extends RouteComponentProps<void> {

    state: RootState;

  }

  export interface State {
    /* empty */
  }
}

class AppComponent extends React.Component<App.Props, App.State> {

  render(): React.ReactNode {
    const { state, children } = this.props;
    const appStyle = {
    };
    const gameStyle = {

    };

    return (
      <div className="training-app" style={appStyle} >
        <h2>Training</h2>
      </div>
    );
  }
}

function mapStateToProps(state: RootState): Partial<App.Props> {
  return {
    state
  };
}

function mapDispatchToProps(dispatch): Partial<App.Props> {
  return {
  };
}

export const App = withRouter(connect(mapStateToProps, mapDispatchToProps)(AppComponent));