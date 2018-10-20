import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { withRouter, Link } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

require('./index.scss');

export namespace Mnist {
    export interface Props extends RouteComponentProps<void> {

    }
}

const MnistContainer = (props: Mnist.Props) => {
    return (
        <div>
            <h1>MNIST coming soon...</h1>
        </div>
    );
};

function mapStateToProps(state: {}): Partial<Mnist.Props> {
    return {

    };
}

function mapDispatchToProps(dispatch): Partial<Mnist.Props> {
    return {
    };
}

export const MnistApp = connect(mapStateToProps, mapDispatchToProps as any)(MnistContainer);