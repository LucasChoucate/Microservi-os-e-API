// Atividades 18 e 20: gateway, pedidos e produtos reais conversando por HTTP.
const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { criarApp: criarProdutos } = require("../servico-produtos/app");
const { criarApp: criarPedidos } = require("../servico-pedidos/app");
const { criarApp: criarGateway } = require("../gateway/app");

function iniciar(app) {
  return new Promise((resolve) => {
    const servidor = app.listen(0, "127.0.0.1", () => {
      resolve({
        url: `http://127.0.0.1:${servidor.address().port}`,
        fechar: () =>
          new Promise((pronto) => {
            servidor.close(pronto);
            servidor.closeAllConnections();
          }),
      });
    });
  });
}

const silencioso = () => {};
let pasta;
let arquivoDados;
let produtos;
let pedidos;
let gateway;
let aberto;

function montarPedidos() {
  return iniciar(
    criarPedidos({
      produtosUrl: produtos.url,
      arquivoDados,
      timeoutMs: 1000,
      log: silencioso,
    })
  );
}

function criarPedido(corpo) {
  return fetch(`${gateway.url}/api/pedidos`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(corpo),
  });
}

beforeEach(async () => {
  pasta = fs.mkdtempSync(path.join(os.tmpdir(), "ponta-a-ponta-"));
  arquivoDados = path.join(pasta, "pedidos.json");
  produtos = await iniciar(criarProdutos({ log: silencioso }));
  pedidos = await montarPedidos();
  gateway = await iniciar(
    criarGateway({
      servicos: { produtos: produtos.url, pedidos: pedidos.url },
      log: silencioso,
    })
  );
  aberto = { produtos: true };
});

afterEach(async () => {
  await gateway.fechar();
  await pedidos.fechar();
  if (aberto.produtos) await produtos.fechar();
  fs.rmSync(pasta, { recursive: true, force: true });
});

test("cria um pedido pelo gateway usando os preços reais do catálogo", async () => {
  const resposta = await criarPedido({
    cliente: "Maria",
    itens: [
      { produtoId: 1, quantidade: 1 },
      { produtoId: 3, quantidade: 2 },
    ],
  });

  assert.equal(resposta.status, 201);
  assert.equal(resposta.headers.get("location"), "/api/pedidos/1");

  const pedido = await resposta.json();
  assert.equal(pedido.valorTotal, 3999.8);
  assert.equal(pedido.itens[1].nome, "Teclado mecânico");

  const consultado = await (await fetch(`${gateway.url}/api/pedidos/1`)).json();
  assert.deepEqual(consultado, pedido);
});

test("um produto criado pelo gateway já pode ser usado em um pedido", async () => {
  const criado = await (
    await fetch(`${gateway.url}/api/produtos`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nome: "Webcam", preco: 299.9 }),
    })
  ).json();

  const pedido = await (
    await criarPedido({
      cliente: "Maria",
      itens: [{ produtoId: criado.id, quantidade: 2 }],
    })
  ).json();
  assert.equal(pedido.valorTotal, 599.8);
});

test("um produto removido não pode mais ser pedido", async () => {
  await fetch(`${gateway.url}/api/produtos/1`, { method: "DELETE" });
  const resposta = await criarPedido({
    cliente: "Maria",
    itens: [{ produtoId: 1, quantidade: 1 }],
  });
  assert.equal(resposta.status, 422);
});

test("o gateway preserva 400 e 422 vindos de pedidos", async () => {
  assert.equal((await criarPedido({ cliente: "Maria" })).status, 400);
  assert.equal(
    (await criarPedido({ cliente: "Maria", itens: [{ produtoId: 999, quantidade: 1 }] }))
      .status,
    422
  );
});

test("com produtos fora do ar, pedido retorna 503 e nada é salvo", async () => {
  await produtos.fechar();
  aberto.produtos = false;

  const resposta = await criarPedido({
    cliente: "Maria",
    itens: [{ produtoId: 1, quantidade: 1 }],
  });
  assert.equal(resposta.status, 503);

  assert.equal((await fetch(`${gateway.url}/api/produtos`)).status, 503);

  const lista = await (await fetch(`${gateway.url}/api/pedidos`)).json();
  assert.equal(lista.total, 0);
});

test("o pedido continua disponível depois de reiniciar o serviço de pedidos", async () => {
  await criarPedido({ cliente: "Maria", itens: [{ produtoId: 1, quantidade: 1 }] });
  await pedidos.fechar();

  const reiniciado = await montarPedidos();
  const pedido = await (await fetch(`${reiniciado.url}/pedidos/1`)).json();
  assert.equal(pedido.cliente, "Maria");
  await reiniciado.fechar();

  // Reabre para o afterEach poder fechar normalmente.
  pedidos = await montarPedidos();
});
