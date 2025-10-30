# Arquivos Arquivados - 30/10/2025

## Motivo do Arquivamento
Scripts de debug, teste e análise que foram criados durante o desenvolvimento mas não fazem parte do código de produção.

## Conteúdo (73 arquivos - 324KB)

### Scripts de Teste (test-*)
- Scripts temporários para testar funcionalidades específicas
- Testes de mídia, imagens, criptografia, cache
- Testes de integração com Evolution API e Spaces

### Scripts de Verificação (check-*)
- Scripts para verificar dados no banco
- Verificações de status de instâncias
- Análise de mensagens e conversas

### Scripts de Análise (analyze-*)
- Análise de duplicatas
- Análise de mensagens de mídia
- Análise de conversas

### Scripts de Correção (fix-*)
- Correções pontuais de dados
- Ajustes de permissões no Spaces
- Correções de conversas duplicadas

### Scripts de Reprocessamento (reprocess-*)
- Reprocessamento de mídias
- Reprocessamento de uploads
- Reprocessamento de mensagens

### Outros Scripts
- Scripts de limpeza de logs
- Scripts de migração (brasileiros, logs)
- Scripts de configuração (CORS, Spaces)
- Scripts de criação de testes (instâncias, usuários)

## Observações
- **Nenhum desses arquivos é usado em produção**
- **Todos os imports do código de produção apontam apenas para src/**
- **Nenhum script npm referencia estes arquivos**
- **Arquivados para referência futura caso necessário**

## Como Restaurar (se necessário)
```bash
# Mover um arquivo específico de volta
mv /path/to/archive/nome-do-arquivo.ts /path/to/server/

# Ou copiar para análise
cp /path/to/archive/nome-do-arquivo.ts /tmp/
```
