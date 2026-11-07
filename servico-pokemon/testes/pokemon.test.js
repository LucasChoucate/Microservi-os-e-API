const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { criarApp } = require("../app");
const { iniciar } = require("./auxiliar");

let externo;
let servico;

before(async () => {
  externo = await iniciar(
    http.createServer((req, res) => {
      res.setHeader("content-type", "application/json");
      if (req.url === "/api/v2/pokemon/25") {
        return res.end(
          JSON.stringify({
            id: 25,
            name: "pikachu",
            height: 4,
            types: [{ slot: 1, type: { name: "electric", url: "x" } }],
            abilities: [
              { slot: 1, ability: { name: "static", url: "x" } },
              { slot: 3, ability: { name: "lightning-rod", url: "x" } },
            ],
          })
        );
      }
      if (req.url === "/api/v2/pokemon/500") {
        res.statusCode = 500;
        return res.end("{}");
      }
      if (req.url === "/api/v2/pokemon/600") {
        return res.end(JSON.stringify({ id: 600 }));
      }
      res.statusCode = 404;
      res.end("Not Found");
    })
  );
  servico = await iniciar(criarApp({ apiUrl: externo.url, log: () => {} }));
});

after(async () => {
  await servico.fechar();
  await externo.fechar();
});

test("devolve nome, tipos e habilidades", async () => {
  const resposta = await fetch(`${servico.url}/pokemon/25`);
  assert.equal(resposta.status, 200);
  assert.deepEqual(await resposta.json(), {
    id: 25,
    nome: "pikachu",
    tipos: ["electric"],
    habilidades: ["static", "lightning-rod"],
  });
});

test("404 da fonte externa vira 404 local", async () => {
  assert.equal((await fetch(`${servico.url}/pokemon/99999`)).status, 404);
});

test("id inválido retorna 400", async () => {
  assert.equal((await fetch(`${servico.url}/pokemon/abc`)).status, 400);
});

test("erro da fonte externa retorna 502", async () => {
  assert.equal((await fetch(`${servico.url}/pokemon/500`)).status, 502);
});

test("resposta externa incompleta retorna 502", async () => {
  assert.equal((await fetch(`${servico.url}/pokemon/600`)).status, 502);
});

test("fonte externa fora do ar retorna 502", async () => {
  const fora = await iniciar(criarApp({ apiUrl: "http://127.0.0.1:9", log: () => {} }));
  assert.equal((await fetch(`${fora.url}/pokemon/25`)).status, 502);
  await fora.fechar();
});
