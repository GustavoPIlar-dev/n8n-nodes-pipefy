import type { INodeProperties } from 'n8n-workflow';

export const cardOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['card'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a card',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a card',
				action: 'Delete a card',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a card',
				action: 'Get a card',
			},
			{
				name: 'Get All',
				value: 'getAll',
				action: 'Get all cards',
			},
			{
				name: 'Move',
				value: 'move',
				action: 'Move a card',
			},
			{
				name: 'Search',
				value: 'search',
				action: 'Search a card',
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a card',
			},
		],
		default: 'create',
	},
];

export const cardFields: INodeProperties[] = [
	/* card:create */
	{
		displayName: 'Pipe Name or ID',
		name: 'pipeId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getPipes',
		},
		required: true,
		default: '',
		description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
		displayOptions: {
			show: {
				resource: ['card'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['card'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Due Date',
				name: 'dueDate',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Phase ID Name or ID',
				name: 'phaseId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getPhases',
					loadOptionsDependsOn: ['pipeId'],
				},
				default: '',
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
			},
			{
				displayName: 'Fields Attributes',
				name: 'fieldsAttributes',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				placeholder: 'Add Attribute',
				default: {},
				options: [
					{
						name: 'attributes',
						displayName: 'Attributes',
						values: [
							{
								displayName: 'Field ID Name or ID',
								name: 'fieldId',
								type: 'options',
								typeOptions: {
									loadOptionsMethod: 'getPipeFields',
									loadOptionsDependsOn: ['pipeId'],
								},
								required: true,
								default: '',
								description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
							},
							{
								displayName: 'Field Value',
								name: 'fieldValue',
								type: 'string',
								required: true,
								default: '',
							},
						],
					},
				],
			},
		],
	},
	/* card:delete, get, move, update */
	{
		displayName: 'Card ID',
		name: 'cardId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['card'],
				operation: ['delete', 'get', 'move', 'update'],
			},
		},
	},
	/* card:getAll */
	{
		displayName: 'Pipe Name or ID',
		name: 'pipeId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getPipes',
		},
		required: true,
		default: '',
		description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
		displayOptions: {
			show: {
				resource: ['card'],
				operation: ['getAll'],
			},
		},
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['card'],
				operation: ['getAll'],
			},
		},
		default: false,
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['card'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
		typeOptions: {
			minValue: 1,
		},
		default: 50,
	},
	/* card:move */
	{
		displayName: 'Destination Phase ID Name or ID',
		name: 'destinationPhaseId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getPhases',
			loadOptionsDependsOn: ['cardId'],
		},
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['card'],
				operation: ['move'],
			},
		},
		description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
	},
	/* card:search */
	{
		displayName: 'Pipe Name or ID',
		name: 'pipeId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getPipes',
		},
		required: true,
		default: '',
		description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
		displayOptions: {
			show: {
				resource: ['card'],
				operation: ['search'],
			},
		},
	},
	{
		displayName: 'Search By',
		name: 'searchBy',
		type: 'options',
		options: [
			{
				name: 'Title',
				value: 'title',
			},
			{
				name: 'Custom Field',
				value: 'customField',
			},
		],
		default: 'title',
		displayOptions: {
			show: {
				resource: ['card'],
				operation: ['search'],
			},
		},
	},
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['card'],
				operation: ['search'],
				searchBy: ['title'],
			},
		},
	},
	{
		displayName: 'Field ID Name or ID',
		name: 'fieldId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getPipeFields',
			loadOptionsDependsOn: ['pipeId'],
		},
		required: true,
		default: '',
		description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
		displayOptions: {
			show: {
				resource: ['card'],
				operation: ['search'],
				searchBy: ['customField'],
			},
		},
	},
	{
		displayName: 'Field Value',
		name: 'fieldValue',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['card'],
				operation: ['search'],
				searchBy: ['customField'],
			},
		},
	},
	/* card:update */
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['card'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Due Date',
				name: 'dueDate',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Fields Attributes',
				name: 'fieldsAttributes',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				placeholder: 'Add Attribute',
				default: {},
				options: [
					{
						name: 'attributes',
						displayName: 'Attributes',
						values: [
							{
								displayName: 'Field ID Name or ID',
								name: 'fieldId',
								type: 'options',
								typeOptions: {
									loadOptionsMethod: 'getPipeFields',
									loadOptionsDependsOn: ['cardId'],
								},
								required: true,
								default: '',
								description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
							},
							{
								displayName: 'Field Value',
								name: 'fieldValue',
								type: 'string',
								required: true,
								default: '',
							},
						],
					},
				],
			},
		],
	},
];
