import type { IHookFunctions, INodeType, INodeTypeDescription, IWebhookFunctions, IWebhookResponseData, IDataObject, ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { pipefyApiRequest } from '../Pipefy/GenericFunctions';

export class PipefyTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Pipefy Trigger',
		name: 'pipefyTrigger',
		icon: { light: 'file:pipefy.svg', dark: 'file:pipefy.dark.svg' },
		group: ['trigger'],
		version: 1,
		description: 'Starts the workflow when Pipefy events occur',
		defaults: {
			name: 'Pipefy Trigger',
		},
		inputs: [],
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
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
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
						name: 'Pipe (Cards)',
						value: 'pipe',
					},
					{
						name: 'Table (Table Records)',
						value: 'table',
					},
				],
				default: 'pipe',
				required: true,
			},
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
						resource: ['pipe'],
					},
				},
			},
			{
				displayName: 'Table Name or ID',
				name: 'tableId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getTables',
				},
				required: true,
				default: '',
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
				displayOptions: {
					show: {
						resource: ['table'],
					},
				},
			},
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				options: [
					{
						name: 'Item Created',
						value: 'card.create',
					},
					{
						name: 'Item Moved',
						value: 'card.move',
					},
					{
						name: 'Item Updated',
						value: 'card.update',
					},
					{
						name: 'Item Deleted',
						value: 'card.delete',
					},
				],
				default: 'card.create',
				required: true,
			},
			{
				displayName: 'Field IDs Filter',
				name: 'fieldIdFilter',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getFields',
				},
				default: [],
				description: 'Select which fields should trigger the webhook. If empty, any field update triggers the webhook.',
				displayOptions: {
					show: {
						event: ['card.update'],
					},
				},
			},
			{
				displayName: 'From Phase(s) Filter',
				name: 'fromPhaseFilter',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getPhases',
				},
				default: [],
				description: 'Select which phase(s) the card must be moved FROM to trigger the webhook. If empty, moves from any phase are considered.',
				displayOptions: {
					show: {
						event: ['card.move'],
						resource: ['pipe'],
					},
				},
			},
			{
				displayName: 'To Phase(s) Filter',
				name: 'toPhaseFilter',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getPhases',
				},
				default: [],
				description: 'Select which phase(s) the card must be moved TO to trigger the webhook. If empty, moves to any phase are considered.',
				displayOptions: {
					show: {
						event: ['card.move'],
						resource: ['pipe'],
					},
				},
			},
			{
				displayName: 'Triggered By Email Filter',
				name: 'triggeredByEmailFilter',
				type: 'string',
				default: '',
				description: 'Only trigger the workflow if the action was performed by this exact user email. Leave empty to allow any user (or bot).',
			},
		],
	};

	methods = {
		loadOptions: {
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
			async getFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];
				const resource = this.getNodeParameter('resource') as string;

				if (resource === 'pipe') {
					const pipeId = this.getNodeParameter('pipeId') as string;
					if (!pipeId) throw new Error('Pipe ID is required to load fields');
					const query = `query n8nGetPipeFields($pipeId: ID!) { pipe(id: $pipeId) { phases { id fields { id internal_id label } } start_form_fields { id internal_id label } } }`;
					const responseData = await pipefyApiRequest.call(this, query, { pipeId });
					
					if (responseData?.pipe?.start_form_fields) {
						for (const field of responseData.pipe.start_form_fields) {
							if (field.internal_id) {
								returnData.push({ name: `[Start Form] ${field.label}`, value: field.internal_id.toString() });
							}
						}
					}
					
					if (responseData?.pipe?.phases) {
						for (const phase of responseData.pipe.phases) {
							if (phase.fields) {
								for (const field of phase.fields) {
									if (field.internal_id) {
										returnData.push({ name: field.label, value: field.internal_id.toString() });
									}
								}
							}
						}
					}
				} else if (resource === 'table') {
					const tableId = this.getNodeParameter('tableId') as string;
					if (!tableId) throw new Error('Table ID is required to load fields');
					const query = `query n8nGetTableFields($tableId: ID!) { table(id: $tableId) { table_fields { id internal_id label } } }`;
					const responseData = await pipefyApiRequest.call(this, query, { tableId });
					if (responseData?.table?.table_fields) {
						for (const field of responseData.table.table_fields) {
							if (field.internal_id) {
								returnData.push({ name: field.label, value: field.internal_id.toString() });
							}
						}
					}
				}
				return returnData;
			},
			async getPhases(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const pipeId = this.getNodeParameter('pipeId') as string;
				if (!pipeId) throw new Error('Pipe ID is required to load phases');
				const query = `query n8nGetPhases($pipeId: ID!) { pipe(id: $pipeId) { phases { id name } } }`;
				const responseData = await pipefyApiRequest.call(this, query, { pipeId });
				const returnData: INodePropertyOptions[] = [];
				if (responseData?.pipe?.phases) {
					for (const phase of responseData.pipe.phases) {
						returnData.push({ name: phase.name, value: phase.id });
					}
				}
				return returnData;
			},
		},
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (webhookData.webhookId !== undefined) {
					return true;
				}
				return false;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const event = this.getNodeParameter('event') as string;
				const resource = this.getNodeParameter('resource') as string;

				const query = `mutation n8nCreateWebhook($input: CreateWebhookInput!) { createWebhook(input: $input) { webhook { id } } }`;
				let actionsEvent = event;
				
				// O Pipefy usa 'card.field_update' tanto para pipes quanto para tables
				if (actionsEvent === 'card.updated' || actionsEvent === 'card.update') {
					actionsEvent = 'card.field_update';
				}

				const input: any = {
					actions: [actionsEvent],
					name: 'n8n Integration Webhook',
					url: webhookUrl,
				};

				let fieldIdFilter: string[] = [];
				try {
					fieldIdFilter = this.getNodeParameter('fieldIdFilter', []) as string[];
				} catch (e) {}

				if (fieldIdFilter && fieldIdFilter.length > 0) {
					const numericIds = fieldIdFilter.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
					if (numericIds.length === 0 && fieldIdFilter.length > 0) {
						throw new Error('Formato inválido nos campos do filtro. Por favor, remova os campos selecionados e selecione-os novamente no nó.');
					}
					input.filters = input.filters || {};
					input.filters.field_id = numericIds;
				}

				let fromPhaseFilter: string[] = [];
				try {
					fromPhaseFilter = this.getNodeParameter('fromPhaseFilter', []) as string[];
				} catch (e) {}

				if (fromPhaseFilter && fromPhaseFilter.length > 0) {
					const numericIds = fromPhaseFilter.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
					if (numericIds.length === 0 && fromPhaseFilter.length > 0) {
						throw new Error('Formato inválido nas fases (From). Por favor, remova as fases selecionadas e selecione-as novamente no nó.');
					}
					input.filters = input.filters || {};
					input.filters.from_phase_id = numericIds;
				}

				let toPhaseFilter: string[] = [];
				try {
					toPhaseFilter = this.getNodeParameter('toPhaseFilter', []) as string[];
				} catch (e) {}

				if (toPhaseFilter && toPhaseFilter.length > 0) {
					const numericIds = toPhaseFilter.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
					if (numericIds.length === 0 && toPhaseFilter.length > 0) {
						throw new Error('Formato inválido nas fases (To). Por favor, remova as fases selecionadas e selecione-as novamente no nó.');
					}
					input.filters = input.filters || {};
					input.filters.to_phase_id = numericIds;
				}

				if (resource === 'pipe') {
					const pipeId = this.getNodeParameter('pipeId') as string;
					input.pipe_id = pipeId;
				} else if (resource === 'table') {
					const tableId = this.getNodeParameter('tableId') as string;
					input.table_id = tableId;
				}

				const responseData = await pipefyApiRequest.call(this, query, { input });

				if (responseData.createWebhook === undefined) {
					return false;
				}

				const webhookData = this.getWorkflowStaticData('node');
				webhookData.webhookId = responseData.createWebhook.webhook.id as string;

				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (webhookData.webhookId !== undefined) {
					const query = `mutation n8nDeleteWebhook($input: DeleteWebhookInput!) { deleteWebhook(input: $input) { success } }`;
					try {
						await pipefyApiRequest.call(this, query, { input: { id: webhookData.webhookId } });
					} catch (error) {
						return false;
					}
					delete webhookData.webhookId;
				}
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const body = req.body as any;
		
		let triggeredByEmailFilter = '';
		try {
			triggeredByEmailFilter = this.getNodeParameter('triggeredByEmailFilter', '') as string;
		} catch (e) {}

		if (triggeredByEmailFilter && body && body.data) {
			const filterEmail = triggeredByEmailFilter.toLowerCase().trim();
			const actorObj = body.data.moved_by || body.data.updated_by || body.data.created_by || body.data.deleted_by;
			
			if (actorObj && actorObj.email) {
				const actorEmail = actorObj.email.toLowerCase().trim();
				if (actorEmail !== filterEmail) {
					// O e-mail do autor não corresponde ao filtro.
					// Retornando objeto vazio, o n8n encerra a execução e descarta o webhook silenciosamente.
					return {};
				}
			}
		}

		return {
			workflowData: [
				this.helpers.returnJsonArray(req.body as IDataObject),
			],
		};
	}
}
