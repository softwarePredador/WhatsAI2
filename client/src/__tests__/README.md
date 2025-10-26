# Frontend Tests

Este diretório contém testes automatizados para prevenir problemas de configuração que podem causar falhas de conectividade entre frontend e backend.

## Problemas Prevenidos

### 1. Conexões WebSocket Diretas
**Problema**: O `socketService.ts` estava fazendo conexões WebSocket diretas para `http://localhost:3001` em vez de usar URLs relativas que passam pelo proxy do Vite.

**Prevenção**: Testes em `socketService.test.ts` garantem que:
- O serviço sempre usa URLs relativas (`/`) para conexões WebSocket
- As conexões passam pelo proxy do Vite (`/socket.io` → `localhost:3001`)

### 2. Chamadas API Diretas
**Problema**: Serviços podiam fazer chamadas diretas para `http://localhost:3001/api` em vez de usar URLs relativas.

**Prevenção**: Testes garantem que os serviços estão configurados para usar URLs relativas que são proxyadas pelo Vite.

### 3. Configuração do Vite Proxy
**Problema**: Alterações na configuração do proxy do Vite podem quebrar a conectividade.

**Prevenção**: Testes em `vite.config.test.ts` verificam que:
- O proxy para `/api` está configurado corretamente
- O proxy para `/socket.io` está configurado corretamente
- As configurações de host permitem conexões externas

## Como Executar os Testes

```bash
# Executar todos os testes
npm test

# Executar testes uma vez
npm run test:run

# Executar testes com interface visual
npm run test:ui
```

## Estrutura dos Testes

```
src/__tests__/
├── socketService.test.ts      # Testes do serviço WebSocket
├── instanceService.test.ts    # Testes do serviço de instâncias
└── vite.config.test.ts        # Testes da configuração Vite
```

## Regras de Configuração

Para manter a compatibilidade com o proxy:

1. **Frontend Services**: Sempre usar URLs relativas (`/api/*`, `/socket.io`)
2. **Vite Proxy**: Manter configuração de proxy para `/api` e `/socket.io`
3. **Environment Variables**: Não definir `VITE_API_URL` ou `VITE_SOCKET_URL` (usar proxy)

## Benefícios

- ✅ Previne regressões em configurações de conectividade
- ✅ Garante que mudanças no código não quebrem a comunicação
- ✅ Documenta o comportamento esperado dos serviços
- ✅ Facilita debugging de problemas de conectividade