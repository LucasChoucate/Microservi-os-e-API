const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { criarApp } = require("../app");
const { iniciar } = require("./auxiliar");

const USUARIO = {
  id: 1,
  name: "Leanne Graham",
  username: "Bret",
  email: "leanne@example.com",
  phone: "1-770",
  website: "example.org",
  address: { city: "Gwenborough", street: "Kulas Light" },
  company: { name: "Romaguera", bs: "x" },
};

let externo;
let servico;

before(async () => {
  externo = await iniciar(
    http.createServer((req, res) => {
      res.setHeader("content-type", "application/json");
      if (req.url === "/users") return res.end(JSON.stringify([USUARIO]));
      if (req.url === "/users/1") return res.end(JSON.stringify(USUARIO));
      if (req.url === "/users/500") {
        res.statusCode = 500;
        return res.end("{}");
      }
      res.statusCode = 404;
      res.end("{}");
    })
  );
  servico = await iniciar(criarApp({ apiUrl: externo.url, log: () => {} }));
});

after(async () => {
  await servico.fechar();
  await externo.fechar();
});

test("GET /usuarios devolve a lista resumida", async () => {
  const corpo = await (await fetch(`${servico.url}/usuarios`)).json();
  assert.deepEqual(corpo, {
    total: 1,
    usuarios: [
      { id: 1, nome: "Leanne Graham", email: "leanne@example.com", cidade: "Gwenborough" },
    ],
  });
});

test("GET /usuarios/:id devolve os detalhes", async () => {
  const resposta = await fetch(`${servico.url}/usuarios/1`);
  assert.equal(resposta.status, 200);
  const corpo = await resposta.json();
  assert.equal(corpo.nome, "Leanne Graham");
  assert.equal(corpo.empresa, "Romaguera");
});

test("usuário inexistente retorna 404", async () => {
  assert.equal((await fetch(`${servico.url}/usuarios/999`)).status, 404);
});

for (const id of ["abc", "0", "-1", "1.5"]) {
  test(`id inválido retorna 400: ${id}`, async () => {
    assert.equal((await fetch(`${servico.url}/usuarios/${id}`)).status, 400);
  });
}

test("erro da API externa retorna 502", async () => {
  assert.equal((await fetch(`${servico.url}/usuarios/500`)).status, 502);
});

test("API externa fora do ar retorna 502 nas duas rotas", async () => {
  const fora = await iniciar(criarApp({ apiUrl: "http://127.0.0.1:9", log: () => {} }));
  assert.equal((await fetch(`${fora.url}/usuarios`)).status, 502);
  assert.equal((await fetch(`${fora.url}/usuarios/1`)).status, 502);
  await fora.fechar();
});
