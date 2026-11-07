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
      if (req.url.startsWith("/ws/01001000/")) {
        return res.end(
          JSON.stringify({
            cep: "01001-000",
            logradouro: "Praça da Sé",
            bairro: "Sé",
            localidade: "São Paulo",
            uf: "SP",
            ibge: "3550308",
          })
        );
      }
      if (req.url.startsWith("/ws/99999999/")) {
        return res.end(JSON.stringify({ erro: "true" }));
      }
      if (req.url.startsWith("/ws/55555555/")) {
        res.statusCode = 500;
        return res.end("{}");
      }
      res.end("isto não é JSON");
    })
  );
  servico = await iniciar(criarApp({ viacepUrl: externo.url, log: () => {} }));
});

after(async () => {
  await servico.fechar();
  await externo.fechar();
});

test("devolve o endereço simplificado (200)", async () => {
  const resposta = await fetch(`${servico.url}/enderecos/01001000`);
  assert.equal(resposta.status, 200);
  assert.deepEqual(await resposta.json(), {
    cep: "01001-000",
    logradouro: "Praça da Sé",
    bairro: "Sé",
    cidade: "São Paulo",
    uf: "SP",
  });
});

test("aceita CEP com hífen", async () => {
  assert.equal((await fetch(`${servico.url}/enderecos/01001-000`)).status, 200);
});

test("CEP sem 8 dígitos retorna 400", async () => {
  assert.equal((await fetch(`${servico.url}/enderecos/123`)).status, 400);
});

test("CEP inexistente retorna 404", async () => {
  assert.equal((await fetch(`${servico.url}/enderecos/99999999`)).status, 404);
});

test("erro da API externa retorna 502", async () => {
  assert.equal((await fetch(`${servico.url}/enderecos/55555555`)).status, 502);
});

test("resposta externa inválida retorna 502", async () => {
  assert.equal((await fetch(`${servico.url}/enderecos/11111111`)).status, 502);
});

test("API externa fora do ar retorna 502", async () => {
  const fora = await iniciar(
    criarApp({ viacepUrl: "http://127.0.0.1:9", log: () => {} })
  );
  assert.equal((await fetch(`${fora.url}/enderecos/01001000`)).status, 502);
  await fora.fechar();
});

test("timeout da API externa retorna 502 sem deixar a requisição pendente", async () => {
  const lento = await iniciar(http.createServer(() => {}));
  const app = await iniciar(
    criarApp({ viacepUrl: lento.url, timeoutMs: 100, log: () => {} })
  );
  assert.equal((await fetch(`${app.url}/enderecos/01001000`)).status, 502);
  await app.fechar();
  await lento.fechar();
});
