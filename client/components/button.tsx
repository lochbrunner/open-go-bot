import * as React from "react";

require('../../node_modules/bootstrap-sass/assets/stylesheets/_bootstrap.scss');

export namespace Button {

  export interface Props extends React.HTMLProps<HTMLButtonElement> {
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
    if (this.props.onClicked)
      this.props.onClicked();
  }

  render(): JSX.Element {
    return <button className='btn btn-default' onClick={this.onClicked} >{this.props.children} </button>;
  }
}