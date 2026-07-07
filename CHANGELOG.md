# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - Atualização do Pipefy Trigger (Webhooks)

### Added (Adicionado)
- **Filtros Avançados de Webhook no n8n**:
  - Filtro por Campo Específico (`Fields ID Filter`) no evento de *Item Updated*, economizando execuções indesejadas no n8n.
  - Filtro por Fase de Origem (`From Phase Filter`) e Fase de Destino (`To Phase Filter`) no evento *Item Moved*, controlando perfeitamente a direção e lógica do fluxo.

### Fixed (Corrigido)
- **Validação de ID no Pipefy**: Foi corrigido um erro no qual o Pipefy Trigger reportava `Invalid format type for one or more filter values` porque valores de string antigos (`short_text`) eram enviados em vez do `internal_id` numérico. 
  - Foi implementado no código-fonte do nó um rastreador rigoroso para `internal_id` para contornar limitações da API oficial do Pipefy.
  - Implementada proteção de tipagem `parseInt` durante a criação de webhook garantindo que erros antigos de JSON salvos na UI pelo n8n gerem um alerta amigável antes mesmo do envio da requisição defeituosa ao Pipefy.
- **Mapeamento de Ações GraphQL**: Corrigida a tradução literal da opção `card.update` da UI. Ela agora é automaticamente traduzida para `card.field_update` no back-end, resolvendo bugs de `Something went wrong` que impediam a ativação de webhooks de atualização em Pipes.

### Internal (Testes e Qualidade)
- Ampliação da suíte do `jest` em `webhook.create.test.ts` para testar especificamente os mapeamentos de strings numéricas e `field_update`.