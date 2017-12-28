import * as React from "react";

require('../../node_modules/bootstrap-sass/assets/stylesheets/_bootstrap.scss');

export namespace Button {

  export interface Props extends React.HTMLProps<HTMLButtonElement> {
    disabled?: boolean;
    tooltip?: string;
    onClicked?(payload?: void): any;
  }

  export interface State {
  }
}

export class Button extends React.Component<Button.Props, Button.State> {

  constructor(props?: Button.Props, context?: any) {
    super(props, context);

    this.onClicked = this.onClicked.bind(this);
    this.state = {};
  }

  onClicked() {
    if (this.props.onClicked && !this.props.disabled)
      this.props.onClicked();
  }

  render(): JSX.Element {
    const { tooltip, children, disabled } = this.props;
    const title = tooltip || (typeof children === 'string' ? children : '');
    const classes = `btn btn-default ${disabled ? 'disabled' : ''}`;
    return <button className={classes} onClick={this.onClicked} title={title}>{children} </button>;
  }
}