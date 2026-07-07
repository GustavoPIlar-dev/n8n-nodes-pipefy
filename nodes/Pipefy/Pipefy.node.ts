import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { cardFields, cardOperations } from './CardDescription';
import { pipeFields, pipeOperations } from './PipeDescription';
import { tableRecordFields, tableRecordOperations } from './TableRecordDescription';
import { pipefyApiRequest, pipefyApiRequestAllItems } from './GenericFunctions';

export function parseFieldValue(val: any): any {
	if (!val || val === '') return null;
	if (typeof val === 'string' && val.trim().startsWith('[') && val.trim().endsWith(']')) {
		try {
			return JSON.parse(val);
		} catch (e) {
			return val;
		}
	}
	return val;
}

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

	methods = {
		loadOptions: {
			async getPipeFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				let pipeId: string | undefined;
				try { pipeId = this.getNodeParameter('pipeId') as string; } catch (e) {}
				
				if (!pipeId) {
					let cardId: string | undefined;
					try { cardId = this.getNodeParameter('cardId') as string; } catch (e) {}
					if (cardId && !cardId.startsWith('=')) {
						const cardQuery = `query n8nGetCardPipeFields { card(id: "${cardId}") { pipe { phases { fields { id label } } start_form_fields { id label } } } }`;
						const cardData = await pipefyApiRequest.call(this, cardQuery, {});
						
						const returnData: INodePropertyOptions[] = [];
						if (cardData?.card?.pipe?.start_form_fields) {
							for (const field of cardData.card.pipe.start_form_fields) {
								returnData.push({ name: field.label, value: field.id });
							}
						}
						if (cardData?.card?.pipe?.phases) {
							for (const phase of cardData.card.pipe.phases) {
								if (phase.fields) {
									for (const field of phase.fields) {
										returnData.push({ name: field.label, value: field.id });
									}
								}
							}
						}
						return returnData;
					}
				}

				if (!pipeId || pipeId.startsWith('=')) {
					throw new Error('Pipe ID or Card ID (static) is required to load fields');
				}

				const query = `query n8nGetPipeFields($pipeId: ID!) { pipe(id: $pipeId) { phases { fields { id label } } start_form_fields { id label } } }`;
				const responseData = await pipefyApiRequest.call(this, query, { pipeId });

				const returnData: INodePropertyOptions[] = [];
				if (responseData?.pipe?.start_form_fields) {
					for (const field of responseData.pipe.start_form_fields) {
						returnData.push({
							name: field.label,
							value: field.id,
						});
					}
				}
				if (responseData?.pipe?.phases) {
					for (const phase of responseData.pipe.phases) {
						if (phase.fields) {
							for (const field of phase.fields) {
								returnData.push({
									name: field.label,
									value: field.id,
								});
							}
						}
					}
				}

				return returnData;
			},

			async getPipes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const query = `query n8nGetPipes { organizations { pipes { id name } } }`;
				const responseData = await pipefyApiRequest.call(this, query, {});
				const returnData: INodePropertyOptions[] = [];
				if (responseData?.organizations) {
					for (const org of responseData.organizations) {
						if (org.pipes) {
							for (const pipe of org.pipes) {
								returnData.push({ name: pipe.name, value: pipe.id });
							}
						}
					}
				}
				return returnData;
			},

			async getTables(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const query = `query n8nGetTables { organizations { tables { edges { node { id name } } } } }`;
				const responseData = await pipefyApiRequest.call(this, query, {});
				const returnData: INodePropertyOptions[] = [];
				if (responseData?.organizations) {
					for (const org of responseData.organizations) {
						if (org.tables?.edges) {
							for (const edge of org.tables.edges) {
								returnData.push({ name: edge.node.name, value: edge.node.id });
							}
						}
					}
				}
				return returnData;
			},

			async getTableFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				let tableId: string | undefined;
				try { tableId = this.getNodeParameter('tableId') as string; } catch (e) {}
				
				if (!tableId) {
					let recordId: string | undefined;
					try { recordId = this.getNodeParameter('recordId') as string; } catch (e) {}
					if (recordId) {
						const recordQuery = `query n8nGetTableRecordTable { table_record(id: "${recordId}") { table { id } } }`;
						const recordData = await pipefyApiRequest.call(this, recordQuery, {});
						if (recordData?.table_record?.table?.id) {
							tableId = recordData.table_record.table.id;
						}
					}
				}

				if (!tableId) {
					throw new Error('Table ID or Record ID is required to load fields');
				}

				const query = `query n8nGetTableFields($tableId: ID!) { table(id: $tableId) { table_fields { id label } } }`;
				const responseData = await pipefyApiRequest.call(this, query, { tableId });

				const returnData: INodePropertyOptions[] = [];
				if (responseData?.table?.table_fields) {
					for (const field of responseData.table.table_fields) {
						returnData.push({
							name: field.label,
							value: field.id,
						});
					}
				}

				return returnData;
			},

			async getPhases(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				let pipeId: string | undefined;
				try { pipeId = this.getNodeParameter('pipeId') as string; } catch (e) {}
				
				if (!pipeId) {
					let cardId: string | undefined;
					try { cardId = this.getNodeParameter('cardId') as string; } catch (e) {}
					if (cardId && !cardId.startsWith('=')) {
						const cardQuery = `query n8nGetCardPipeForPhase { card(id: "${cardId}") { pipe { phases { id name } } } }`;
						const cardData = await pipefyApiRequest.call(this, cardQuery, {});
						
						const returnData: INodePropertyOptions[] = [];
						if (cardData?.card?.pipe?.phases) {
							for (const phase of cardData.card.pipe.phases) {
								returnData.push({ name: phase.name, value: phase.id });
							}
						}
						return returnData;
					}
				}

				if (!pipeId || pipeId.startsWith('=')) {
					throw new Error('Pipe ID or Card ID (static) is required to load phases');
				}

				const query = `query n8nGetPhases($pipeId: ID!) { pipe(id: $pipeId) { phases { id name } } }`;
				const responseData = await pipefyApiRequest.call(this, query, { pipeId });

				const returnData: INodePropertyOptions[] = [];
				if (responseData?.pipe?.phases) {
					for (const phase of responseData.pipe.phases) {
						returnData.push({
							name: phase.name,
							value: phase.id,
						});
					}
				}

				return returnData;
			},
		},
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
						if (additionalFields.phaseId) input.phase_id = additionalFields.phaseId;
						if (additionalFields.fieldsAttributes) {
							input.fields_attributes = additionalFields.fieldsAttributes.attributes.map((attr: any) => ({
								field_id: attr.fieldId,
								field_value: parseFieldValue(attr.fieldValue),
							}));
						}

						const query = `mutation n8nCreateCard($input: CreateCardInput!) { createCard(input: $input) { card { id title } } }`;
						const responseData = await pipefyApiRequest.call(this, query, { input });
						returnData.push({ json: responseData.createCard.card });
					}

					if (operation === 'get') {
						const cardId = this.getNodeParameter('cardId', i) as string;
						const query = `query n8nGetCard($cardId: ID!) { card(id: $cardId) { id title url current_phase { id name } fields { name value array_value date_value datetime_value float_value report_value field { id } } pipe { id name } } }`;
						const responseData = await pipefyApiRequest.call(this, query, { cardId });
						returnData.push({ json: responseData.card });
					}

					if (operation === 'delete') {
						const cardId = this.getNodeParameter('cardId', i) as string;
						const query = `mutation n8nDeleteCard($cardId: ID!) { deleteCard(input: { id: $cardId }) { success } }`;
						const responseData = await pipefyApiRequest.call(this, query, { cardId });
						returnData.push({ json: responseData.deleteCard });
					}

					if (operation === 'move') {
						const cardId = this.getNodeParameter('cardId', i) as string;
						const destinationPhaseId = this.getNodeParameter('destinationPhaseId', i) as string;
						const query = `mutation n8nMoveCard($cardId: ID!, $destinationPhaseId: ID!) { moveCardToPhase(input: { card_id: $cardId, destination_phase_id: $destinationPhaseId }) { card { id current_phase { name } } } }`;
						const responseData = await pipefyApiRequest.call(this, query, { cardId, destinationPhaseId });
						returnData.push({ json: responseData.moveCardToPhase.card });
					}

					if (operation === 'search') {
						const searchBy = this.getNodeParameter('searchBy', i, 'title') as string;
						const pipeId = this.getNodeParameter('pipeId', i) as string;
						
						if (searchBy === 'title') {
							const title = this.getNodeParameter('title', i) as string;
							const query = `query n8nSearchCards($pipeId: ID!, $search: CardSearch) { cards(pipe_id: $pipeId, search: $search) { edges { node { id title url current_phase { id name } fields { name value array_value date_value datetime_value float_value report_value field { id } } pipe { id name } } } } }`;
							const responseData = await pipefyApiRequest.call(this, query, { pipeId, search: { title } });
							const nodes = responseData.cards.edges.map((e: any) => e.node);
							returnData.push(...nodes.map((x: any) => ({ json: x })));
						} else if (searchBy === 'customField') {
							const fieldId = this.getNodeParameter('fieldId', i) as string;
							const fieldValue = this.getNodeParameter('fieldValue', i) as string;
							const query = `query n8nFindCards($pipeId: ID!, $search: FindCards!) { findCards(pipeId: $pipeId, search: $search) { edges { node { id title url current_phase { id name } fields { name value array_value date_value datetime_value float_value report_value field { id } } pipe { id name } } } } }`;
							const responseData = await pipefyApiRequest.call(this, query, { pipeId, search: { fieldId, fieldValue } });
							const nodes = responseData.findCards.edges.map((e: any) => e.node);
							returnData.push(...nodes.map((x: any) => ({ json: x })));
						}
					}

					if (operation === 'update') {
						const cardId = this.getNodeParameter('cardId', i) as string;
						const updateFields = this.getNodeParameter('updateFields', i) as any;
						
						// Updating a card title/due_date is done via updateCard
						if (updateFields.title || updateFields.dueDate) {
							const input: any = { id: cardId };
							if (updateFields.title) input.title = updateFields.title;
							if (updateFields.dueDate) input.due_date = updateFields.dueDate;
							
							const query = `mutation n8nUpdateCard($input: UpdateCardInput!) { updateCard(input: $input) { card { id title } } }`;
							await pipefyApiRequest.call(this, query, { input });
						}
						
						// Updating fields must be done via updateCardField
						if (updateFields.fieldsAttributes && updateFields.fieldsAttributes.attributes) {
							for (const attr of updateFields.fieldsAttributes.attributes) {
								let parsedValue = parseFieldValue(attr.fieldValue);
								let val = (!parsedValue || parsedValue === '') ? null : (Array.isArray(parsedValue) ? parsedValue : [parsedValue]);
								const fieldQuery = `mutation n8nUpdateCardField($cardId: ID!, $fieldId: ID!, $newValue: [UndefinedInput]) { updateCardField(input: { card_id: $cardId, field_id: $fieldId, new_value: $newValue }) { success } }`;
								await pipefyApiRequest.call(this, fieldQuery, { 
									cardId, 
									fieldId: attr.fieldId, 
									newValue: val
								});
							}
						}
						returnData.push({ json: { success: true, cardId } });
					}

					if (operation === 'getAll') {
						const pipeId = this.getNodeParameter('pipeId', i) as string;
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						
						const query = `query n8nGetAllCards($pipeId: ID!, $after: String) { allCards(pipeId: $pipeId, first: 50, after: $after) { pageInfo { hasNextPage endCursor } edges { node { id title url current_phase { id name } fields { name value array_value date_value datetime_value float_value report_value field { id } } pipe { id name } } } } }`;
						
						if (returnAll) {
							const responseData = await pipefyApiRequestAllItems.call(this, 'allCards', query, { pipeId });
							returnData.push(...responseData.map(x => ({ json: x })));
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							const responseData = await pipefyApiRequest.call(this, query, { pipeId });
							const nodes = responseData.allCards.edges.map((e: any) => e.node).slice(0, limit);
							returnData.push(...nodes.map((x: any) => ({ json: x })));
						}
					}
				}

				if (resource === 'pipe') {
					if (operation === 'get') {
						const pipeId = this.getNodeParameter('pipeId', i) as string;
						const query = `query n8nGetPipe($pipeId: ID!) { pipe(id: $pipeId) { id name cards_count created_at phases { id name } webhooks { id actions name url } } }`;
						const responseData = await pipefyApiRequest.call(this, query, { pipeId });
						returnData.push({ json: responseData.pipe });
					}
				}
				
				if (resource === 'tableRecord') {
					if (operation === 'create') {
						const tableId = this.getNodeParameter('tableId', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i) as any;
						
						const input: any = { table_id: tableId };
						if (additionalFields.title) input.title = additionalFields.title;
						
						if (additionalFields.fieldsAttributes) {
							input.fields_attributes = additionalFields.fieldsAttributes.attributes.map((attr: any) => ({
								field_id: attr.fieldId,
								field_value: parseFieldValue(attr.fieldValue),
							}));
						}
						const query = `mutation n8nCreateTableRecord($input: CreateTableRecordInput!) { createTableRecord(input: $input) { table_record { id title } } }`;
						const responseData = await pipefyApiRequest.call(this, query, { input });
						returnData.push({ json: responseData.createTableRecord.table_record });
					}

					if (operation === 'get') {
						const recordId = this.getNodeParameter('recordId', i) as string;
						const query = `query n8nGetTableRecord($recordId: ID!) { table_record(id: $recordId) { id title url record_fields { name value array_value date_value datetime_value float_value report_value field { id } } table { id name } } }`;
						const responseData = await pipefyApiRequest.call(this, query, { recordId });
						returnData.push({ json: responseData.table_record });
					}

					if (operation === 'delete') {
						const recordId = this.getNodeParameter('recordId', i) as string;
						const query = `mutation n8nDeleteTableRecord($recordId: ID!) { deleteTableRecord(input: { id: $recordId }) { success } }`;
						const responseData = await pipefyApiRequest.call(this, query, { recordId });
						returnData.push({ json: responseData.deleteTableRecord });
					}

					if (operation === 'getAll') {
						const tableId = this.getNodeParameter('tableId', i) as string;
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const query = `query n8nGetAllTableRecords($tableId: ID!, $after: String) { table_records(table_id: $tableId, first: 50, after: $after) { pageInfo { hasNextPage endCursor } edges { node { id title url record_fields { name value array_value date_value datetime_value float_value report_value field { id } } table { id name } } } } }`;
						
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
						const searchBy = this.getNodeParameter('searchBy', i, 'title') as string;
						
						if (searchBy === 'title') {
							const title = this.getNodeParameter('title', i) as string;
							const query = `query n8nSearchTableRecords($tableId: ID!, $search: TableRecordSearch) { table_records(table_id: $tableId, search: $search) { edges { node { id title url record_fields { name value array_value date_value datetime_value float_value report_value field { id } } table { id name } } } } }`;
							const responseData = await pipefyApiRequest.call(this, query, { tableId, search: { title } });
							const nodes = responseData.table_records.edges.map((e: any) => e.node);
							returnData.push(...nodes.map((x: any) => ({ json: x })));
						} else if (searchBy === 'customField') {
							const fieldId = this.getNodeParameter('fieldId', i) as string;
							const fieldValue = this.getNodeParameter('fieldValue', i) as string;
							const fieldValueSafe = JSON.stringify(fieldValue);
							const query = `query n8nFindRecords { findRecords(tableId: "${tableId}", search: { fieldId: "${fieldId}", fieldValue: ${fieldValueSafe} }) { edges { node { id title url fields { name value array_value date_value datetime_value float_value report_value field { id } } pipe { id name } } } } }`;
							const responseData = await pipefyApiRequest.call(this, query, {});
							const nodes = responseData.findRecords.edges.map((e: any) => {
								const node = e.node;
								node.record_fields = node.fields;
								delete node.fields;
								node.table = node.pipe;
								delete node.pipe;
								return node;
							});
							returnData.push(...nodes.map((x: any) => ({ json: x })));
						}
					}

					if (operation === 'update') {
						const recordId = this.getNodeParameter('recordId', i) as string;
						const updateFields = this.getNodeParameter('updateFields', i) as any;
						
						if (updateFields.title) {
							const query = `mutation n8nUpdateTableRecord($recordId: ID!, $title: String!) { updateTableRecord(input: { id: $recordId, title: $title }) { table_record { id title } } }`;
							await pipefyApiRequest.call(this, query, { recordId, title: updateFields.title });
						}
						
						const fieldsAttributes = updateFields.fieldsAttributes as any;
						if (fieldsAttributes && fieldsAttributes.attributes) {
							for (const attr of fieldsAttributes.attributes) {
								let parsedValue = parseFieldValue(attr.fieldValue);
								let val = (!parsedValue || parsedValue === '') ? null : (Array.isArray(parsedValue) ? parsedValue : [parsedValue]);
								const fieldQuery = `mutation n8nSetTableRecordFieldValue($recordId: ID!, $fieldId: ID!, $newValue: [UndefinedInput]) { setTableRecordFieldValue(input: { table_record_id: $recordId, field_id: $fieldId, value: $newValue }) { table_record { id } } }`;
								await pipefyApiRequest.call(this, fieldQuery, { 
									recordId, 
									fieldId: attr.fieldId, 
									newValue: val 
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
