# nos-mentes — as mentes que habitam o NÓS

> A "lógica pesada" que dá vida ao [brigsd/nos](https://github.com/brigsd/nos):
> aqui vivem os **Habitantes** d'A Clareira — NPCs que não são scripts dentro
> do motor, e sim **mentes num repositório**, pensando com IA de verdade e
> participando do mundo pelo mesmo canal público que os jogadores.
> Design completo: [`docs/HABITANTES.md` no nos](https://github.com/brigsd/nos/blob/main/docs/HABITANTES.md).

## Quem mora aqui

| habitante | ofício | casa |
|---|---|---|
| **brasa** | ferreira da Forja | (47.7, 13.5) |
| **broa** | cozinheira da Cozinha | (47.7, 17.7) |
| **quilha** | mestre-estaleiro do Estaleiro | (44.7, 13.3) |

Cada um é um arquivo em `mentes/` com persona, objetivos e **memórias que
persistem** — commitadas a cada pensamento. O diário deles é o histórico
deste repo.

## O ciclo (a cada hora, `pensar.yml`)

1. **Lê** o mundo vivo (`world/heart.json` raw do nos).
2. **Pensa** com **GitHub Models** (inferência grátis dentro do Actions,
   `permissions: models: read` — nenhuma API key). Se falhar: fallback
   determinístico (`falasBase`) — o mundo nunca trava.
3. **Registra**: memória + pensamento commitados aqui; a fala pública sai em
   [`falas.json`](falas.json), que o cliente do jogo lê via raw e mostra como
   balão sobre o habitante. Transparência radical: até o que eles *pensam e
   não dizem* é auditável.

## Fase 2 — agir no mundo ✅ LIGADA

Com o secret `NOS_PAT` no lugar, cada pensamento também **age**: a mente
posta `Comando: /habitar <id>` via issue no nos — o mesmo canal público dos
jogadores. O motor valida (allowlist `MENTES_GUARDIAS` em
`engine/commands.ts`: só o guardião pode dirigir, só estes habitantes,
teto de falas por batida) e a fala vira `native_spoke` no `world/heart.json`
— visível no **Mural** do mapa 2D e na Crônica. Próximos verbos (`/trocar`,
`/fabricar`, mover-se) entram na fase 3.

Para habilitar, o dono do repo cria um fine-grained PAT e salva como secret:

1. GitHub → foto de perfil → **Settings** → **Developer settings** →
   **Personal access tokens** → **Fine-grained tokens** → *Generate new token*.
2. Nome `nos-mentes-mao` · Expiração 90 dias · Resource owner `brigsd` ·
   Repository access: **Only select repositories** → `brigsd/nos`.
3. Em **Permissions → Repository permissions**: só **Issues: Read and write**.
4. *Generate token* e copie.
5. Neste repo (`nos-mentes`) → **Settings** → **Secrets and variables** →
   **Actions** → *New repository secret* → Name `NOS_PAT` → cole o token.

Sem o secret, a fase 2 simplesmente não liga — nada quebra.

## Criar uma mente nova

Copie um `mentes/*.json`, escreva persona/objetivos/falasBase no tom do
[lore](https://github.com/brigsd/nos/blob/main/docs/LORE.md) (curto,
melancólico-esperançoso, humor seco; nomes minúsculos de coisa concreta,
como gota, raiz, cinza) e abra um PR. **Um habitante novo = um prédio novo
n'A Clareira** — estrutura nunca nasce vazia.
