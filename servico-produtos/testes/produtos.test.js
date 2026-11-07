const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { criarApp } = require("../app");
const { iniciar } = require("./auxiliar");

let servidor;

beforeEach(async () => {
  servidor = await iniciar(criarApp({ log: () => {} }));
});

afterEach(async () => {
  await servidor.fechar();
});

function enviar(metodo, caminho, corpo) {
  return fetch(servidor.url + caminho, {
    method: metodo,
    headers: { "content-type": "application/json" },
    body: typeof corpo === "string" ? corpo : JSON.stringify(corpo),
  });
}

test("GET /status informa nome, versão e status", async () => {
  const resposta = await fetch(`${servidor.url}/status`);
  assert.equal(resposta.status, 200);
  assert.deepEqual(await resposta.json(), {
    servico: "servico-produtos",
    versao: "1.0.0",
    status: "ok",
  });
});

test("GET /produtos lista o catálogo", async () => {
  const corpo = await (await fetch(`${servidor.url}/produtos`)).json();
  assert.equal(corpo.total, 5);
});

test("GET /produtos/:id retorna o produto ou 404/400", async () => {
  const existente = await fetch(`${servidor.url}/produtos/1`);
  assert.equal(existente.status, 200);
  assert.equal((await existente.json()).nome, "Notebook");

  assert.equal((await fetch(`${servidor.url}/produtos/999`)).status, 404);
  assert.equal((await fetch(`${servidor.url}/produtos/abc`)).status, 400);
});

test("filtros de categoria e limite funcionam juntos", async () => {
  const corpo = await (
    await fetch(`${servidor.url}/produtos?categoria=perifericos&limite=1`)
  ).json();
  assert.equal(corpo.total, 1);
  assert.equal(corpo.produtos[0].categoria, "perifericos");
});

for (const consulta of [
  "categoria=inexistente",
  "categoria=geral&categoria=moveis",
  "limite=0",
  "limite=-1",
  "limite=abc",
  "limite=101",
  "limite=2.5",
]) {
  test(`filtro inválido retorna 400: ${consulta}`, async () => {
    const resposta = await fetch(`${servidor.url}/produtos?${consulta}`);
    assert.equal(resposta.status, 400);
  });
}

test("POST /produtos cria com 201 e Location", async () => {
  const resposta = await enviar("POST", "/produtos", { nome: "Webcam", preco: 299.9 });
  assert.equal(resposta.status, 201);
  assert.equal(resposta.headers.get("location"), "/produtos/6");
  assert.deepEqual(await resposta.json(), {
    id: 6,
    nome: "Webcam",
    preco: 299.9,
    categoria: "geral",
  });
});

for (const [descricao, corpo] of [
  ["sem preço", { nome: "Webcam" }],
  ["sem nome", { preco: 10 }],
  ["nome em branco", { nome: "   ", preco: 10 }],
  ["preço negativo", { nome: "Webcam", preco: -1 }],
  ["preço zero", { nome: "Webcam", preco: 0 }],
  ["preço como texto", { nome: "Webcam", preco: "10" }],
  ["categoria inválida", { nome: "Webcam", preco: 10, categoria: "x" }],
  ["corpo em lista", [{ nome: "Webcam", preco: 10 }]],
  ["JSON malformado", '{"nome": '],
]) {
  test(`POST /produtos retorna 400: ${descricao}`, async () => {
    const resposta = await enviar("POST", "/produtos", corpo);
    assert.equal(resposta.status, 400);
  });
}

test("POST /produtos sem corpo retorna 400", async () => {
  const resposta = await fetch(`${servidor.url}/produtos`, { method: "POST" });
  assert.equal(resposta.status, 400);
});

test("PUT atualiza com 200 e mantém o id", async () => {
  const resposta = await enviar("PUT", "/produtos/1", { nome: "Ultrabook", preco: 4200 });
  assert.equal(resposta.status, 200);
  assert.equal((await resposta.json()).id, 1);

  const salvo = await (await fetch(`${servidor.url}/produtos/1`)).json();
  assert.equal(salvo.nome, "Ultrabook");
});

test("PUT valida o corpo e diferencia 400 de 404", async () => {
  assert.equal((await enviar("PUT", "/produtos/1", { nome: "" })).status, 400);
  assert.equal(
    (await enviar("PUT", "/produtos/999", { nome: "A", preco: 1 })).status,
    404
  );
});

test("DELETE remove com 204 e o produto deixa de existir", async () => {
  const resposta = await fetch(`${servidor.url}/produtos/1`, { method: "DELETE" });
  assert.equal(resposta.status, 204);
  assert.equal(await resposta.text(), "");
  assert.equal((await fetch(`${servidor.url}/produtos/1`)).status, 404);
  assert.equal(
    (await fetch(`${servidor.url}/produtos/1`, { method: "DELETE" })).status,
    404
  );
});

test("o id de um produto removido não é reutilizado", async () => {
  await enviar("POST", "/produtos", { nome: "A", preco: 1 });
  await fetch(`${servidor.url}/produtos/6`, { method: "DELETE" });
  const novo = await (await enviar("POST", "/produtos", { nome: "B", preco: 1 })).json();
  assert.equal(novo.id, 7);
});

test("rota desconhecida retorna 404 em JSON", async () => {
  const resposta = await fetch(`${servidor.url}/nao-existe`);
  assert.equal(resposta.status, 404);
  assert.ok((await resposta.json()).erro);
});
