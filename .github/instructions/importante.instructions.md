---
applyTo: '**'
---
nao executar comandos npm run dev, npm run build, e npx tsx -e , pois eles vao entrar em loop,
se for preciso fazer busca em banco tenta de outra forma, pois esses comandos vao entrar em loop
 infinito tentando executar esse comando,

 quer bater em algum link poara ver se esta retornando 200 usa
 Invoke-WebRequest -Uri "http://localhost:3000" -Method GET | Select-Object -ExpandProperty StatusCode

IMPORTANTE: Antes de executar qualquer comando, consulte o arquivo COMANDOS-TESTADOS.md
para ver quais comandos funcionaram e quais devem ser evitados para não perder tempo.

 so informar o motivo sem ficar criando arquivo .md sem motivo, o resto pode ser executado normalmente 