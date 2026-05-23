# Diretrizes de Automação - SaaS Kanux

## Contexto de Segundo Cérebro (Obsidian)
As notas de documentação ficam na pasta `docs/` e servem como a verdade central do projeto.

## Comando de Sincronização Automática (Código ◄► Obsidian)
Sempre que eu solicitar a criação, alteração ou correção de uma funcionalidade (backend ou frontend):
1. **No Código:** Aplique as alterações necessárias nos arquivos (`.ts`, `.tsx`, `.java`, etc).
2. **No Obsidian:** Abra, crie ou atualize o arquivo correspondente na pasta `docs/` (ex: `docs/Sincronizacao_Offline.md`, `docs/backend-websocket.md`, `docs/frontend/websocket.md`).
3. **Padrão do Obsidian:** Escreva a documentação em formato Markdown estruturado, incluindo a lógica de negócio atualizada e links internos usando colchetes duplos (ex: [[Estrutura do Banco Local]] ou [[Endpoints WebSocket]]).

## Fluxo de Trabalho
- Antes de alterar qualquer código, consulte a documentação relevante em `docs/`.
- Após a alteração, atualize a nota correspondente.
- Use sempre links internos para conectar regras, decisões e módulos.

## Exemplo de Prompt para Copilot Chat
> Implemente a funcionalidade X e atualize a documentação em docs/Y.md com a nova lógica e exemplos de uso.

---

## Histórico
- 2026-05-23: Automação de documentação integrada ao Obsidian e VS Code.
