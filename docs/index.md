# Documentação Oficial: n8n-nodes-pipefy

Bem-vindo à documentação do pacote `n8n-nodes-pipefy`. Este pacote estende enormemente as possibilidades do nó oficial com recursos frequentemente solicitados pela comunidade, como paginação automática (returnAll), suporte real a campos customizados (Custom Fields) em todas as operações e compatibilidade total com "Table Records" e "Triggers".

---

## 1. Pipefy Node (Action Node)

Este é o nó principal do pacote para manipulação e leitura de dados.

### 💳 Recursos de Autenticação
- **Personal Access Token:** Autenticação tradicional, ideal para automações de único usuário.
- **OAuth2:** Autenticação ideal para corporações ou automações centralizadas. O n8n gerenciará o token de forma segura.

### 🗂️ Cards
As operações de Cards suportam todos os Custom Fields do Pipefy de maneira inteligente:
- **Create**: Você pode passar o Título e criar Custom Fields abrindo o menu "Additional Fields -> Fields Attributes". É possível buscar os campos diretamente por Dropdown.
- **Update**: Funciona exatamente como a criação. Uma vantagem extra é a **limpeza de nulos**: se você enviar um valor vazio em um campo customizado via n8n, o nó fará um bypass para esvaziá-lo com segurança no banco do Pipefy.
- **Delete**: Exclui o card imediatamente.
- **Get**: Recupera o card com TODOS os valores formatados. (Diferente da API comum, nós injetamos campos como `date_value`, `array_value` diretamente na resposta do n8n para que você não perca dados complexos).
- **Get All**: Traz todos os cards de um Pipe. Use `Limit` para testes e `Return All` para paginação inteligente que suga milhares de cards em uma única requisição.
- **Search**: Busca rápida! Passando apenas um ID e um Valor, procuramos um campo customizado dentro daquele Pipe específico. 
- **Move**: Selecione a fase de destino por Dropdown para mover o card.

### 📋 Table Records
Os Table Records receberam no nosso pacote o mesmo carinho que os Cards!
- As funções de **Create**, **Update**, **Delete**, **Get** e **Get All** funcionam idênticas às funções de Cards listadas acima.
- O campo Customizado em tabelas é preenchido através da área "Update Fields" ou "Additional Fields" usando a chave `Fields Attributes`.

---

## 2. Pipefy Trigger (Webhook Node)

O nosso nó de Webhook te poupa de ter que cadastrar automações manualmente no Pipefy.

### Como funciona?
Basta configurar as credenciais, colocar o ID do seu Pipe ou da sua Tabela, e ativar o nó no n8n. Por debaixo dos panos, o n8n viaja até a nuvem do Pipefy e registra a URL dele nas configurações do seu Pipe. Quando o fluxo é desativado no n8n, ele volta na nuvem e limpa esse registro para manter o ambiente saudável.

### Configurações
- **Resource**: 
  - Selecione `Pipe (Cards)` para monitorar atividades tradicionais (Card Criado, Card Movido, Card Atualizado).
  - Selecione `Table (Table Records)` para ouvir inserções e modificações exclusivas do banco de dados relacional.
- **Eventos:** Item Created, Item Moved, Item Updated, Item Deleted.

### Filtros Avançados (Novo! 🚀)
Para economizar execuções no n8n e no Pipefy, você pode filtrar exatamente quando o webhook deve ser disparado:
- **Fields ID Filter**: Ao usar o evento "Item Updated", você pode restringir o disparo do webhook **apenas** a alterações em campos específicos (seja em um Formulário Inicial ou em campos das Fases). 
- **From Phase / To Phase Filter**: Ao usar o evento "Item Moved", você pode definir exatamente as Fases de Origem e/ou as Fases de Destino que devem disparar o gatilho, evitando automações indesejadas e loops.

### Testando Localmente
Se você está usando o n8n na sua própria máquina (localhost), o Pipefy não conseguirá enviar dados para o seu webhook, pois `localhost` não existe na internet. 
Para testes locais, use um sistema de túnel via terminal antes de iniciar o n8n. Recomendamos fortemente o ngrok:
```bash
ngrok http 5678
```
Com a URL pública gerada, rode o n8n informando sua base webhook:
```bash
export WEBHOOK_URL="https://sua-url-gerada.ngrok-free.dev"
n8n start
```
