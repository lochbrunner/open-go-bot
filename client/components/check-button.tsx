import * as React from "react";

require('../../node_modules/bootstrap-sass/assets/stylesheets/_bootstrap.scss');

export namespace CheckButton {

    export interface Props extends React.HTMLProps<HTMLButtonElement> {
        checked: boolean;
        onSwitched?(payload: {nextValue: boolean}): any;
    }

    export interface State {
    }
}

export class CheckButton extends React.Component<CheckButton.Props, CheckButton.State> {

    constructor(props?: CheckButton.Props, context?: any) {
        super(props, context);

        this.onSwitched = this.onSwitched.bind(this);
        this.state = {};
    }

    onSwitched() {
        if (this.props.onSwitched)
            this.props.onSwitched({nextValue: !this.props.checked});
    }

    render(): JSX.Element {
        const className = "btn " + (this.props.checked ? "btn-primary" : "btn-default");
        return <button className={className} onClick={this.onSwitched} >{this.props.children} </button>;
    }
}