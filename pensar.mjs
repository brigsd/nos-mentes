#!/usr/bin/env node
/**
 * pensar.mjs — o ciclo de pensamento dos Habitantes d'A Clareira.
 *
 * Para cada mente em mentes/*.json:
 *   1. LÊ o mundo vivo (world/heart.json raw do brigsd/nos — público).
 *   2. PENSA com GitHub Models (inferência grátis dentro do Actions, token
 *      nativo com permissão models:read — nenhuma API key externa).
 *   3. Se o Models falhar/limitar, cai no FALLBACK determinístico
 *      (falasBase rotacionadas pela batida) — o mundo nunca trava.
 *   4. REGISTRA: memória + pensamento commitados aqui (o diário íntimo,
 *      auditável como tudo no NÓS) e a fala pública vai pra falas.json,
 *      que os clientes do jogo leem via raw (camada 100% opcional).
 *
 * Fase 2 (quando o PAT NOS_PAT existir): além de falar, AGIR — postar
 * comandos via issue no brigsd/nos, o mesmo canal público dos jogadores.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const WORLD_URL = 'https://raw.githubusercontent.com/brigsd/nos/main/world/heart.json';
const MODELS_URL = 'https://models.github.ai/inference/chat/completions';
const MODEL = 'openai/gpt-4o-mini';
const MAX_MEMORIAS = 40;

function resumirMundo(w) {
  const jogadores = Object.entries(w.players ?? {}).map(
    ([login, p]) => `${login} em (${p.position.x},${p.position.y})${p.energy != null ? `, energia ${p.energy}` : ''}`,
  );
  const eventos = (w.events ?? []).slice(-6).map((e) => e.message ?? e.type ?? JSON.stringify(e).slice(0, 90));
  return [
    `Batida atual do Pulso: #${w.meta.tickCount}.`,
    `Nós (jogadores) no mundo: ${jogadores.length ? jogadores.join('; ') : 'nenhum agora'}.`,
    `Máquinas d'A Clareira: forja (48,13), cozinha (48,18), bancada (44,18), estaleiro (44,13).`,
    eventos.length ? `Últimos acontecimentos: ${eventos.join(' | ')}` : 'Nada digno de nota nas últimas batidas.',
  ].join('\n');
}

async function pensarComModels(mente, resumo, token) {
  const memorias = mente.memorias.slice(-8).map((m) => `- ${m.texto ?? m}`).join('\n') || '- (ainda sem memórias)';
  const system = [
    `Você é ${mente.persona}`,
    '',
    'REGRAS DO MUNDO (lore do NÓS — obedeça):',
    '- Tom melancólico-esperançoso; frases curtas e concretas; humor seco ocasional. NADA de épico grandiloquente.',
    '- Termos de git são mitologia natural (Pulso, batida, Crônica, ramo, Registro) — nunca piada explícita de programador.',
    '- Jogadores são "Nós" (viajantes). Os outros habitantes: brasa (ferreira), broa (cozinheira), quilha (mestre-estaleiro).',
    '- Fale em pt-BR. Máx 120 caracteres na fala, 160 no pensamento.',
    '',
    `Seus objetivos: ${mente.objetivos.join('; ')}.`,
    `Suas memórias recentes:\n${memorias}`,
  ].join('\n');
  const user = [
    'O mundo agora:',
    resumo,
    '',
    'Responda APENAS um JSON válido, sem markdown:',
    '{"fala": "o que você diz em voz alta na praça agora", "pensamento": "o que você pensa mas não diz", "lembranca": "algo digno de guardar na memória, ou null"}',
  ].join('\n');

  const r = await fetch(MODELS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.9,
      max_tokens: 300,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!r.ok) throw new Error(`Models HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  const raw = j.choices?.[0]?.message?.content ?? '';
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) throw new Error(`resposta sem JSON: ${raw.slice(0, 120)}`);
  const out = JSON.parse(m[0]);
  if (typeof out.fala !== 'string' || !out.fala.trim()) throw new Error('fala vazia');
  const limpa = (s, n) => String(s).replace(/[<>&]/g, '').trim().slice(0, n);
  return {
    fala: limpa(out.fala, 140),
    pensamento: limpa(out.pensamento ?? '', 180),
    lembranca: out.lembranca ? limpa(out.lembranca, 180) : null,
    origem: 'models',
  };
}

/* fase 2 — a MÃO: postar o comando /habitar no brigsd/nos (mesmo canal
   público dos jogadores). Só roda se o secret NOS_PAT existir; qualquer
   falha vira log e a fala segue viva no falas.json. */
async function agir(mente, fala, pat) {
  const r = await fetch('https://api.github.com/repos/brigsd/nos/issues', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${pat}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify({
      title: `Comando: /habitar ${mente.id}`,
      body: `### Habitante\n${mente.id}\n\n### Mensagem\n${fala}`,
    }),
  });
  if (!r.ok) throw new Error(`issues HTTP ${r.status}: ${(await r.text()).slice(0, 160)}`);
  return (await r.json()).number;
}

function fallback(mente, batida) {
  const fala = mente.falasBase[batida % mente.falasBase.length];
  return { fala, pensamento: '(a mente descansou nesta batida — rotina falou por ela)', lembranca: null, origem: 'rotina' };
}

const world = await (await fetch(WORLD_URL)).json();
const resumo = resumirMundo(world);
const batida = world.meta.tickCount;
const token = process.env.GITHUB_TOKEN ?? '';
const pat = process.env.NOS_PAT ?? '';
const falas = [];

for (const f of readdirSync('mentes').filter((n) => n.endsWith('.json')).sort()) {
  const path = `mentes/${f}`;
  const mente = JSON.parse(readFileSync(path, 'utf8'));
  let out;
  try {
    if (!token) throw new Error('sem GITHUB_TOKEN (execução local?)');
    out = await pensarComModels(mente, resumo, token);
  } catch (e) {
    console.error(`${mente.id}: Models indisponível (${e.message}) — usando a rotina.`);
    out = fallback(mente, batida);
  }
  if (pat && out.fala !== mente.ultimaFalaPostada) {
    try {
      const n = await agir(mente, out.fala, pat);
      mente.ultimaFalaPostada = out.fala;
      console.log(`${mente.id} agiu no mundo: issue #${n} (Comando: /habitar)`);
    } catch (e) {
      console.error(`${mente.id}: a mão falhou (${e.message}) — a fala fica só no falas.json.`);
    }
  }
  mente.memorias.push({ batida, pensamento: out.pensamento, ...(out.lembranca ? { texto: out.lembranca } : {}) });
  if (mente.memorias.length > MAX_MEMORIAS) mente.memorias = mente.memorias.slice(-MAX_MEMORIAS);
  mente.ultimaBatida = batida;
  writeFileSync(path, `${JSON.stringify(mente, null, 2)}\n`);
  falas.push({ id: mente.id, nome: mente.nome, oficio: mente.oficio, x: mente.casa.x, y: mente.casa.y, fala: out.fala, origem: out.origem, batida });
  console.log(`${mente.id} (${out.origem}): "${out.fala}"`);
}

writeFileSync('falas.json', `${JSON.stringify({ atualizadoEm: new Date().toISOString(), batida, habitantes: falas }, null, 2)}\n`);
console.log(`falas.json — batida #${batida}, ${falas.length} habitantes.`);
