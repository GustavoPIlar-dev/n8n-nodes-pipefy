![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# n8n-nodes-pipefy

Nó customizado e não oficial do Pipefy para o n8n. Este nó expande imensamente os limites do nó oficial do Pipefy no n8n, trazendo suporte nativo para criação, edição e exclusão de **Table Records** (Registros de Tabelas) e **Custom Fields** dinâmicos, com total paginação suportada nativamente.

## Funcionalidades Principais

Este pacote inclui dois nós principais:

- **Pipefy Node** - O nó de ação principal para você gerenciar dados na API GraphQL do Pipefy:
  - **Cards**: Create, Update, Delete, Get, Get All (paginado) e Search (por título ou campo customizado).
  - **Pipes**: Get All (suporte a paginação total).
  - **Table Records**: Suporte a *Tables* com Create, Update, Delete, Get e Get All (paginado).
  - Preenchimento inteligente de Custom Fields na criação/atualização.
  - Movimentação de Cards por fases de maneira simplificada.

- **Pipefy Trigger** - Nó ativado por eventos para construir automações *Event-Driven*:
  - Escute eventos dinâmicos (Create, Update, Move, Delete) em **Pipes** ou em **Tables**.
  - O Webhook é gerado automaticamente na API do Pipefy no momento em que você ativa o fluxo no n8n (e destruído ao desativar).
  - Resposta instantânea de payload em formato JSON.

## Instalação (Uso em Produção)

Existem duas maneiras de adicionar esse nó à sua instância em produção:

### Pelo Painel do n8n (NPM)
1. Acesse o painel do seu n8n.
2. Navegue até **Settings > Community Nodes**.
3. Clique em **Install** e busque por `n8n-nodes-pipefy`.
4. Aprove e aguarde a instalação.

### Instalação Manual (Servidor Privado)
1. Faça o build do código fonte (`npm run build`).
2. Copie a pasta gerada para a pasta de custom nodes do seu n8n (ex: `~/.n8n/custom/`).
3. Reinicie seu n8n.

## Documentação

Por favor, acesse a pasta [/docs](docs/) deste repositório para detalhes de como usar cada operação específica deste pacote.

## Autenticação

Para se conectar à sua conta Pipefy, o nó requer credenciais. O n8n-nodes-pipefy suporta dois métodos modernos:
- **Personal Access Token**: Pode ser gerado nas suas configurações de conta do Pipefy em "Personal access tokens".
- **OAuth2**: Para integrações no nível empresarial/Service Account.

## Licença

[MIT](LICENSE.md)
