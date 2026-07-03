import type { INodeProperties } from 'n8n-workflow';

export const tableRecordOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['tableRecord'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a table record',
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a table record',
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a table record',
			},
			{
				name: 'Get All',
				value: 'getAll',
				action: 'Get all table records',
			},
			{
				name: 'Search',
				value: 'search',
				action: 'Search a table record',
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a table record',
			},
		],
		default: 'create',
	},
];

export const tableRecordFields: INodeProperties[] = [
	/* tableRecord:create, getAll, search */
	{
		displayName: 'Table ID',
		name: 'tableId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['tableRecord'],
				operation: ['create', 'getAll', 'search'],
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
				resource: ['tableRecord'],
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
									loadOptionsMethod: 'getTableFields',
									loadOptionsDependsOn: ['tableId'],
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
	/* tableRecord:delete, get, update */
	{
		displayName: 'Record ID',
		name: 'recordId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['tableRecord'],
				operation: ['delete', 'get', 'update'],
			},
		},
	},
	/* tableRecord:update */
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['tableRecord'],
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
									loadOptionsMethod: 'getTableFields',
									loadOptionsDependsOn: ['recordId'],
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
	/* tableRecord:getAll */
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['tableRecord'],
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
				resource: ['tableRecord'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
		typeOptions: {
			minValue: 1,
		},
		default: 50,
	},
	/* tableRecord:search */
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['tableRecord'],
				operation: ['search'],
			},
		},
	},
];
