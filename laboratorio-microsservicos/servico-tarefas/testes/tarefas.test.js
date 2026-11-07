const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { criarApp } = require("../app");
const { iniciar } = require("./auxiliar");

const TAREFAS = [
  { userId: 1, id: 1, title: "primeira", completed: false },
  { userId: 2, id: 2, title: "segunda", completed: true },
];

let externo;
let servico;

before(async () => {
  externo = await iniciar(
    http.createServer((req, res) => {
      const url = new URL(req.url, "http://externo");
      const userId = url.searchParams.get("userId");
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify(userId ? TAREFAS.filter((t) => t.userId === Number(userId)) : TAREFAS)
      );
    })
  );
  servico = await iniciar(criarApp({ apiUrl: externo.url, log: () => {} }));
});

after(async () => {
  await servico.fechar();
  await externo.fechar();
});

test("sem filtro devolve todas as tarefas traduzidas", async () => {
  const corpo = await (await fetch(`${servico.url}/tarefas`)).json();
  assert.equal(corpo.total, 2);
  assert.deepEqual(corpo.tarefas[0], {
    id: 1,
    usuarioId: 1,
    titulo: "primeira",
    concluida: false,
  });
});

test("com filtro devolve só as tarefas do usuário", async () => {
  const corpo = await (await fetch(`${servico.url}/tarefas?usuario=2`)).json();
  assert.equal(corpo.total, 1);
  assert.equal(corpo.tarefas[0].usuarioId, 2);
});

test("usuário sem tarefas devolve lista vazia", async () => {
  const corpo = await (await fetch(`${servico.url}/tarefas?usuario=99`)).json();
  assert.deepEqual(corpo, { total: 0, tarefas: [] });
});

for (const consulta of ["usuario=abc", "usuario=0", "usuario=", "usuario=1&usuario=2"]) {
  test(`filtro inválido retorna 400: ${consulta}`, async () => {
    assert.equal((await fetch(`${servico.url}/tarefas?${consulta}`)).status, 400);
  });
}

test("API externa fora do ar retorna 502", async () => {
  const fora = await iniciar(criarApp({ apiUrl: "http://127.0.0.1:9", log: () => {} }));
  assert.equal((await fetch(`${fora.url}/tarefas`)).status, 502);
  await fora.fechar();
});
