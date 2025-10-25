---
applyTo: '**'
---
nao encerrar e nem tentar executar npm run dev, nem npm run build, nao ficar adicionando resumo final,
NAO EXECUTAR COMANDO   'npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();' voce fica em loop
 infinito tentando executar esse comando,
 so informar o motivo sem ficar criando arquivo .md sem motivo, o resto pode ser executado normalmente 