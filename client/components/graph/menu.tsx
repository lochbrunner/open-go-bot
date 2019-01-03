import { MenuItem, Node } from 'react-flow-editor';
import * as React from 'react';

const factory = (type: Model.Node['type']) => (): Node & { [x: string]: any } => {
    return {
        name: 'Add',
        type,
        id: '',
        inputs: [],
        outputs: [],
        properties: { display: 'only-dots' },
        classNames: [type]
    };
};

export const menu = (props: {}) => {
    const types: Model.Node['type'][] = [
        'variable',
        'convolution',
        'relu',
        'max-pool',
        'mat-mul',
        'add',
        'reshape'
    ];
    return (
        <div className="flow-menu">
            {types.map((type, i) => <MenuItem key={i} classNames={[type]} name={type} factory={factory(type)} />)}
        </div>
    );
};