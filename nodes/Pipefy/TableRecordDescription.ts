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
		displayName: 'Title',
		name: 'title',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['tableRecord'],
				operation: ['create'],
			},
		},
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
		displayOptions: {
			show: {
				resource: ['tableRecord'],
				operation: ['create', 'update'],
			},
		},
		options: [
			{
				name: 'attributes',
				displayName: 'Attributes',
				values: [
					{
						displayName: 'Field ID',
						name: 'fieldId',
						type: 'string',
						required: true,
						default: '',
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
	/* tableRecord:delete, update */
	{
		displayName: 'Record ID',
		name: 'recordId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['tableRecord'],
				operation: ['delete', 'update'],
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
