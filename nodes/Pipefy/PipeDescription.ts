import type { INodeProperties } from 'n8n-workflow';

export const pipeOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['pipe'],
			},
		},
		options: [
			{
				name: 'Get',
				value: 'get',
				description: 'Get data of a pipe',
				action: 'Get a pipe',
			},
		],
		default: 'get',
	},
];

export const pipeFields: INodeProperties[] = [
	{
		displayName: 'Pipe Name or ID',
		name: 'pipeId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getPipes',
		},
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['pipe'],
				operation: ['get'],
			},
		},
		description: 'The ID of the pipe to retrieve',
	},
];
