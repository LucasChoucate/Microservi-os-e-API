const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { criarApp } = require("../app");
const { iniciar } = require("./auxiliar");

let produtos;
let gateway;
let ultima;

before(async () => {
  produtos = await iniciar(
    http.createServer((req, res) => {
      const partes = [];
      req.on("data", (parte) => partes.push(parte));
      req.on("end", () => {
        ultima = {
          metodo: req.method,
          url: req.url,
          corpo: Buffer.concat(partes).toString(),
          tipo: req.headers["content-type"],
          requestId: req.headers["x-request-id"],
        };

        if (req.url.startsWith("/produtos/204")) {
          res.statusCode = 204;
          return res.end();
        }
        res.setHeader("content-type", "application/json");
        if (req.method === "POST") {
          res.statusCode = 201;
          res.setHeader("location", "/produtos/9");
          return res.end(JSON.stringify({ id: 9 }));
        }
        if (req.url.startsWith("/produtos/999")) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ erro: "Produto não encontrado" }));
        }
        res.end(JSON.stringify({ ok: true }));
      });
    })
  );
  gateway = await iniciar(
    criarApp({
      servicos: { produtos: produtos.url, pedidos: "http://127.0.0.1:9" },
      log: () => {},
    })
  );
});

after(async () => {
  await gateway.fechar();
  await produtos.fechar();
});

test("encaminha o caminho e a consulta sem o prefixo /api", async () => {
  const resposta = await fetch(`${gateway.url}/api/produtos?categoria=moveis&limite=1`);
  assert.equal(resposta.status, 200);
  assert.equal(ultima.url, "/produtos?categoria=moveis&limite=1");
});

test("preserva o status 404 e o corpo do serviço", async () => {
  const resposta = await fetch(`${gateway.url}/api/produtos/999`);
  assert.equal(resposta.status, 404);
  assert.deepEqual(await resposta.json(), { erro: "Produto não encontrado" });
});

test("preserva o status 204 sem corpo", async () => {
  const resposta = await fetch(`${gateway.url}/api/produtos/204`, { method: "DELETE" });
  assert.equal(resposta.status, 204);
  assert.equal(await resposta.text(), "");
  assert.equal(ultima.metodo, "DELETE");
});

test("encaminha o corpo e ajusta o Location para o caminho público", async () => {
  const resposta = await fetch(`${gateway.url}/api/produtos`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: '{"nome":"Webcam"}',
  });
  assert.equal(resposta.status, 201);
  assert.equal(resposta.headers.get("location"), "/api/produtos/9");
  assert.equal(ultima.corpo, '{"nome":"Webcam"}');
  assert.equal(ultima.tipo, "application/json");
});

test("JSON malformado chega ao serviço, que é quem valida", async () => {
  await fetch(`${gateway.url}/api/produtos`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: '{"nome":',
  });
  assert.equal(ultima.corpo, '{"nome":');
});

test("repassa o x-request-id recebido e o devolve ao cliente", async () => {
  const resposta = await fetch(`${gateway.url}/api/produtos`, {
    headers: { "x-request-id": "chamada-1" },
  });
  assert.equal(ultima.requestId, "chamada-1");
  assert.equal(resposta.headers.get("x-request-id"), "chamada-1");
});

test("gera um x-request-id quando o recebido é inválido", async () => {
  const resposta = await fetch(`${gateway.url}/api/produtos`, {
    headers: { "x-request-id": "tem espaço e símbolos <>" },
  });
  assert.match(resposta.headers.get("x-request-id"), /^[\w-]{36}$/);
});

test("serviço fora do ar retorna 503", async () => {
  const resposta = await fetch(`${gateway.url}/api/pedidos`);
  assert.equal(resposta.status, 503);
  assert.equal((await resposta.json()).servico, "pedidos");
});

test("serviço travado retorna 503 dentro do timeout", async () => {
  const travado = await iniciar(http.createServer(() => {}));
  const app = await iniciar(
    criarApp({ servicos: { produtos: travado.url }, timeoutMs: 150, log: () => {} })
  );
  assert.equal((await fetch(`${app.url}/api/produtos`)).status, 503);
  await app.fechar();
  await travado.fechar();
});

for (const caminho of ["/api", "/api/desconhecido", "/api/produtosx", "/produtos"]) {
  test(`rota fora do mapa retorna 404: ${caminho}`, async () => {
    assert.equal((await fetch(gateway.url + caminho)).status, 404);
  });
}

test("responde ao CORS de um frontend", async () => {
  const resposta = await fetch(`${gateway.url}/status`, {
    headers: { origin: "http://localhost:5173" },
  });
  assert.equal(resposta.headers.get("access-control-allow-origin"), "*");
});
