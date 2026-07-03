import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { cardFields, cardOperations } from './CardDescription';
import { pipeFields, pipeOperations } from './PipeDescription';
import { tableRecordFields, tableRecordOperations } from './TableRecordDescription';
import { pipefyApiRequest, pipefyApiRequestAllItems } from './GenericFunctions';

export class Pipefy implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Pipefy',
		name: 'pipefy',
		icon: { light: 'file:pipefy.svg', dark: 'file:pipefy.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Consume Pipefy API',
		defaults: {
			name: 'Pipefy',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'pipefyOAuth2Api',
				required: true,
				displayOptions: {
					show: {
						authentication: ['oAuth2'],
					},
				},
			},
			{
				name: 'pipefyApi',
				required: true,
				displayOptions: {
					show: {
						authentication: ['personalToken'],
					},
				},
			},
		],
		properties: [
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				options: [
					{
						name: 'Personal Access Token',
						value: 'personalToken',
					},
					{
						name: 'OAuth2 (Service Account)',
						value: 'oAuth2',
					},
				],
				default: 'personalToken',
			},
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Card',
						value: 'card',
					},
					{
						name: 'Pipe',
						value: 'pipe',
					},
					{
						name: 'Table Record',
						value: 'tableRecord',
					},
				],
				default: 'card',
			},
			...cardOperations,
			...cardFields,
			...pipeOperations,
			...pipeFields,
			...tableRecordOperations,
			...tableRecordFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'card') {
					if (operation === 'create') {
						const pipeId = this.getNodeParameter('pipeId', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i) as any;
						
						const input: any = { pipe_id: pipeId };
						if (additionalFields.title) input.title = additionalFields.title;
						if (additionalFields.dueDate) input.due_date = additionalFields.dueDate;
						if (additionalFields.fieldsAttributes) {
							input.fields_attributes = additionalFields.fieldsAttributes.attributes.map((attr: any) => ({
								field_id: attr.fieldId,
								field_value: attr.fieldValue,
							}));
						}

						const query = `mutation($input: CreateCardInput!) { createCard(input: $input) { card { id title } } }`;
						const responseData = await pipefyApiRequest.call(this, query, { input });
						returnData.push({ json: responseData.createCard.card });
					}

					if (operation === 'delete') {
						const cardId = this.getNodeParameter('cardId', i) as string;
						const query = `mutation($cardId: ID!) { deleteCard(input: { id: $cardId }) { success } }`;
						const responseData = await pipefyApiRequest.call(this, query, { cardId });
						returnData.push({ json: responseData.deleteCard });
					}

					if (operation === 'move') {
						const cardId = this.getNodeParameter('cardId', i) as string;
						const destinationPhaseId = this.getNodeParameter('destinationPhaseId', i) as string;
						const query = `mutation($cardId: ID!, $destinationPhaseId: ID!) { moveCardToPhase(input: { card_id: $cardId, destination_phase_id: $destinationPhaseId }) { card { id current_phase { name } } } }`;
						const responseData = await pipefyApiRequest.call(this, query, { cardId, destinationPhaseId });
						returnData.push({ json: responseData.moveCardToPhase.card });
					}

					if (operation === 'search') {
						const title = this.getNodeParameter('title', i) as string;
						const pipeId = this.getNodeParameter('pipeId', i) as string;
						// Pipefy supports search globally or within a pipe. Since we ask for title and pipeId:
						const query = `query($pipeId: ID!, $title: String!) { cards(pipe_id: $pipeId, search: $title) { edges { node { id title url } } } }`;
						const responseData = await pipefyApiRequest.call(this, query, { pipeId, title });
						const nodes = responseData.cards.edges.map((e: any) => e.node);
						returnData.push(...nodes.map((x: any) => ({ json: x })));
					}

					if (operation === 'update') {
						const cardId = this.getNodeParameter('cardId', i) as string;
						const updateFields = this.getNodeParameter('updateFields', i) as any;
						
						// Updating a card title/due_date is done via updateCard
						if (updateFields.title || updateFields.dueDate) {
							const input: any = { id: cardId };
							if (updateFields.title) input.title = updateFields.title;
							if (updateFields.dueDate) input.due_date = updateFields.dueDate;
							
							const query = `mutation($input: UpdateCardInput!) { updateCard(input: $input) { card { id title } } }`;
							await pipefyApiRequest.call(this, query, { input });
						}
						
						// Updating fields must be done via updateCardField
						if (updateFields.fieldsAttributes && updateFields.fieldsAttributes.attributes) {
							for (const attr of updateFields.fieldsAttributes.attributes) {
								const fieldQuery = `mutation($cardId: ID!, $fieldId: ID!, $newValue: [String]) { updateCardField(input: { card_id: $cardId, field_id: $fieldId, new_value: $newValue }) { success } }`;
								await pipefyApiRequest.call(this, fieldQuery, { 
									cardId, 
									fieldId: attr.fieldId, 
									newValue: [attr.fieldValue] 
								});
							}
						}
						returnData.push({ json: { success: true, cardId } });
					}

					if (operation === 'getAll') {
						const pipeId = this.getNodeParameter('pipeId', i) as string;
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						
						const query = `query($pipeId: ID!, $after: String) { pipe(id: $pipeId) { cards(first: 50, after: $after) { pageInfo { hasNextPage endCursor } edges { node { id title } } } } }`;
						
						if (returnAll) {
							const responseData = await pipefyApiRequestAllItems.call(this, 'pipe.cards', query, { pipeId });
							returnData.push(...responseData.map(x => ({ json: x })));
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							const responseData = await pipefyApiRequest.call(this, query, { pipeId });
							const nodes = responseData.pipe.cards.edges.map((e: any) => e.node).slice(0, limit);
							returnData.push(...nodes.map((x: any) => ({ json: x })));
						}
					}
				}

				if (resource === 'pipe') {
					if (operation === 'get') {
						const pipeId = this.getNodeParameter('pipeId', i) as string;
						const query = `query($pipeId: ID!) { pipe(id: $pipeId) { id name } }`;
						const responseData = await pipefyApiRequest.call(this, query, { pipeId });
						returnData.push({ json: responseData.pipe });
					}
				}
				
				if (resource === 'tableRecord') {
					if (operation === 'create') {
						const tableId = this.getNodeParameter('tableId', i) as string;
						const title = this.getNodeParameter('title', i) as string;
						const fieldsAttributes = this.getNodeParameter('fieldsAttributes', i) as any;
						
						const input: any = { table_id: tableId, title };
						if (fieldsAttributes.attributes) {
							input.fields_attributes = fieldsAttributes.attributes.map((attr: any) => ({
								field_id: attr.fieldId,
								field_value: attr.fieldValue,
							}));
						}
						const query = `mutation($input: TableRecordCreateInput!) { createTableRecord(input: $input) { table_record { id title } } }`;
						const responseData = await pipefyApiRequest.call(this, query, { input });
						returnData.push({ json: responseData.createTableRecord.table_record });
					}

					if (operation === 'delete') {
						const recordId = this.getNodeParameter('recordId', i) as string;
						const query = `mutation($recordId: ID!) { deleteTableRecord(input: { id: $recordId }) { success } }`;
						const responseData = await pipefyApiRequest.call(this, query, { recordId });
						returnData.push({ json: responseData.deleteTableRecord });
					}

					if (operation === 'getAll') {
						const tableId = this.getNodeParameter('tableId', i) as string;
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const query = `query($tableId: ID!, $after: String) { table_records(table_id: $tableId, first: 50, after: $after) { pageInfo { hasNextPage endCursor } edges { node { id title } } } }`;
						
						if (returnAll) {
							const responseData = await pipefyApiRequestAllItems.call(this, 'table_records', query, { tableId });
							returnData.push(...responseData.map(x => ({ json: x })));
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							const responseData = await pipefyApiRequest.call(this, query, { tableId });
							const nodes = responseData.table_records.edges.map((e: any) => e.node).slice(0, limit);
							returnData.push(...nodes.map((x: any) => ({ json: x })));
						}
					}

					if (operation === 'search') {
						const tableId = this.getNodeParameter('tableId', i) as string;
						const title = this.getNodeParameter('title', i) as string;
						const query = `query($tableId: ID!, $title: String!) { table_records(table_id: $tableId, search: $title) { edges { node { id title } } } }`;
						const responseData = await pipefyApiRequest.call(this, query, { tableId, title });
						const nodes = responseData.table_records.edges.map((e: any) => e.node);
						returnData.push(...nodes.map((x: any) => ({ json: x })));
					}

					if (operation === 'update') {
						const recordId = this.getNodeParameter('recordId', i) as string;
						const updateFields = this.getNodeParameter('updateFields', i) as any;
						
						if (updateFields.title) {
							const query = `mutation($recordId: ID!, $title: String!) { updateTableRecord(input: { id: $recordId, title: $title }) { table_record { id title } } }`;
							await pipefyApiRequest.call(this, query, { recordId, title: updateFields.title });
						}
						
						const fieldsAttributes = this.getNodeParameter('fieldsAttributes', i) as any;
						if (fieldsAttributes && fieldsAttributes.attributes) {
							for (const attr of fieldsAttributes.attributes) {
								const fieldQuery = `mutation($recordId: ID!, $fieldId: ID!, $newValue: [String]) { setTableRecordFieldValue(input: { table_record_id: $recordId, field_id: $fieldId, value: $newValue }) { table_record { id } } }`;
								await pipefyApiRequest.call(this, fieldQuery, { 
									recordId, 
									fieldId: attr.fieldId, 
									newValue: [attr.fieldValue] 
								});
							}
						}
						returnData.push({ json: { success: true, recordId } });
					}
				}

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
