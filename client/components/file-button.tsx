import * as React from 'react';
import * as _ from 'lodash';

require('../../node_modules/bootstrap-sass/assets/stylesheets/_bootstrap.scss');
require('./file-button.scss');

interface FileReaderEventTarget extends EventTarget {
  result: string;
}

interface FileReaderEvent extends Event {
  target: FileReaderEventTarget;
  getMessage(): string;
}

export namespace FileButton {

  export interface Props extends React.HTMLProps<HTMLButtonElement> {
    tooltip?: string;
    disabled?: boolean;
    onSelected?(payload?: string): any;
  }

  export interface State {
  }
}

export class FileButton extends React.Component<FileButton.Props, FileButton.State> {

  private id: string;
  constructor(props?: FileButton.Props, context?: any) {
    super(props, context);

    this.onChange = this.onChange.bind(this);
    this.state = {};
  }

  componentWillMount() {
    this.id = _.uniqueId('file-button-');
  }

  onChange(e: any) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = event => {
      if (this.props.onSelected)
        this.props.onSelected((event.target as any).result);
    };
    reader.readAsText(file);

  }

  render(): JSX.Element {

    const rootStyle: React.CSSProperties = {
      display: 'inline-block'
    };
    const { tooltip, children, disabled } = this.props;

    const title = tooltip || (typeof children === 'string' ? children : '');
    const classes = `btn btn-default ${disabled ? 'disabled' : ''}`;

    return (
      <div title={title} style={rootStyle}>
        <input onChange={this.onChange} type="file" name="file" id={this.id} className="inputfile" data-multiple-caption="{count} files selected"
        />
        <label className={classes} htmlFor={this.id}>
          <span>{this.props.children}</span>
        </label>
      </div>);
  }
}