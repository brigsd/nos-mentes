# nos-mentes — Harness do Projeto

Você está no **nos-mentes**: as **mentes** dos Habitantes d'A Clareira — os NPCs
do [brigsd/nos](https://github.com/brigsd/nos) que não são scripts no motor, e
sim repositórios que pensam com IA (GitHub Models) e agem no mundo pelo mesmo
canal público dos jogadores. Este repo é a "lógica pesada" e a memória deles.

## Acordo de trabalho

O mesmo do `nos`: **Tiago (`brigsd`) é o ideador** (visão/rumo/escopo), **Claude é
o coder** (integridade técnica, decisões, merges). Faça as chamadas técnicas e
mescle o que estiver verde; pare só em decisões de **produto** (o que os
Habitantes devem ser, mudança de rumo, algo irreversível). Chat mínimo, pt-BR.

## Antes de qualquer trabalho

1. **Lore é lei.** A persona, a voz e os objetivos de cada Habitante seguem
   [`docs/HABITANTES.md`](https://github.com/brigsd/nos/blob/main/docs/HABITANTES.md)
   e [`docs/LORE.md`](https://github.com/brigsd/nos/blob/main/docs/LORE.md) do
   `nos`. Incoerência narrativa não passa.
2. As personas + memórias vivem em `mentes/` (um arquivo por Habitante: brasa,
   broa, quilha). A memória **persiste commitada** — o histórico do repo é o
   diário deles. Não apague memória; acrescente.
3. O ciclo é `pensar.mjs`, disparado de hora em hora por `.github/workflows/pensar.yml`.

## Como funciona (o ciclo `pensar.yml`)

1. Lê o mundo vivo (`world/heart.json` raw do `nos`).
2. Pensa com **GitHub Models** (inferência grátis dentro do Actions,
   `permissions: models: read` — sem API key). Falhou? Fallback determinístico.
3. Publica: escreve `falas.json` (o `nos` FPS lê e mostra o balão) e/ou age no
   mundo abrindo issue de comando no `nos` (a "mão" via PAT `NOS_PAT`).
4. Commita a memória atualizada.

Sem Node toolchain nem testes: roda `node pensar.mjs` no Actions. Rode local com
as mesmas env vars pra depurar (ver `README.md`).

## Regras invioláveis

- Tudo voltado ao jogador em **pt-BR**; código e commits em inglês.
- A fala é **idempotente** (`ultimaFalaPostada`): reprocessar não duplica.
- Nenhum segredo commitado. A "mão" usa o PAT `NOS_PAT` (secret do Actions);
  diagnóstico do 403 no `README.md`.
- Mudança de comportamento das mentes é mudança de **lore** — coerência com o
  `nos` antes de tudo.

## Ao encerrar

O estado importante já é commitado pelo ciclo (memórias, `falas.json`). Mudou
código/persona? Deixe claro no commit e, se afeta o design, anote no
`docs/HABITANTES.md` do `nos` (a fonte de verdade do design).
