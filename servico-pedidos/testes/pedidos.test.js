const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { criarApp } = require("../app");
const { iniciar } = require("./auxiliar");

const CATALOGO = {
  1: { id: 1, nome: "Notebook", preco: 3500 },
  2: { id: 2, nome: "Caneta", preco: 19.99 },
  3: { id: 3, nome: "Clipe", preco: 0.1 },
};

let pasta;
let arquivoDados;
let produtos;
let servico;
let idsRecebidos;

function novoServico(opcoes = {}) {
  return iniciar(
    criarApp({ produtosUrl: produtos.url, arquivoDados, log: () => {}, ...opcoes })
  );
}

function criarPedido(url, corpo) {
  return fetch(`${url}/pedidos`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-request-id": "teste-123" },
    body: typeof corpo === "string" ? corpo : JSON.stringify(corpo),
  });
}

beforeEach(async () => {
  pasta = fs.mkdtempSync(path.join(os.tmpdir(), "pedidos-"));
  arquivoDados = path.join(pasta, "pedidos.json");
  idsRecebidos = [];

  produtos = await iniciar(
    http.createServer((req, res) => {
      idsRecebidos.push(req.headers["x-request-id"]);
      const id = req.url.split("/").pop();
      res.setHeader("content-type", "application/json");

      if (id === "500") {
        res.statusCode = 500;
        return res.end("{}");
      }
      if (id === "600") return res.end("isto não é JSON");
      if (id === "700") return res.end(JSON.stringify({ id: 700 }));
      if (!CATALOGO[id]) {
        res.statusCode = 404;
        return res.end("{}");
      }
      res.end(JSON.stringify(CATALOGO[id]));
    })
  );
  servico = await novoServico();
});

afterEach(async () => {
  await servico.fechar();
  await produtos.fechar();
  fs.rmSync(pasta, { recursive: true, force: true });
});

test("cria o pedido com preços do serviço de produtos e total calculado", async () => {
  const resposta = await criarPedido(servico.url, {
    cliente: "  Maria  ",
    itens: [
      { produtoId: 1, quantidade: 2 },
      { produtoId: 2, quantidade: 3 },
    ],
  });

  assert.equal(resposta.status, 201);
  assert.equal(resposta.headers.get("location"), "/pedidos/1");

  const pedido = await resposta.json();
  assert.equal(pedido.id, 1);
  assert.equal(pedido.cliente, "Maria");
  assert.equal(pedido.valorTotal, 7059.97);
  assert.deepEqual(pedido.itens[1], {
    produtoId: 2,
    nome: "Caneta",
    precoUnitario: 19.99,
    quantidade: 3,
    subtotal: 59.97,
  });
});

test("o total não sofre erro de arredondamento", async () => {
  const pedido = await (
    await criarPedido(servico.url, {
      cliente: "Maria",
      itens: [{ produtoId: 3, quantidade: 3 }],
    })
  ).json();
  assert.equal(pedido.valorTotal, 0.3);
});

test("ignora preço e total enviados pelo cliente", async () => {
  const pedido = await (
    await criarPedido(servico.url, {
      cliente: "Maria",
      valorTotal: 1,
      id: 999,
      itens: [{ produtoId: 1, quantidade: 1, preco: 1 }],
    })
  ).json();
  assert.equal(pedido.id, 1);
  assert.equal(pedido.valorTotal, 3500);
});

test("repassa o x-request-id ao serviço de produtos", async () => {
  await criarPedido(servico.url, {
    cliente: "Maria",
    itens: [{ produtoId: 1, quantidade: 1 }],
  });
  assert.deepEqual(idsRecebidos, ["teste-123"]);
});

for (const [descricao, corpo] of [
  ["sem cliente", { itens: [{ produtoId: 1, quantidade: 1 }] }],
  ["cliente em branco", { cliente: " ", itens: [{ produtoId: 1, quantidade: 1 }] }],
  ["sem itens", { cliente: "Maria" }],
  ["itens vazio", { cliente: "Maria", itens: [] }],
  ["item nulo", { cliente: "Maria", itens: [null] }],
  ["quantidade zero", { cliente: "Maria", itens: [{ produtoId: 1, quantidade: 0 }] }],
  ["quantidade fracionada", { cliente: "Maria", itens: [{ produtoId: 1, quantidade: 1.5 }] }],
  ["quantidade em texto", { cliente: "Maria", itens: [{ produtoId: 1, quantidade: "2" }] }],
  ["quantidade excessiva", { cliente: "Maria", itens: [{ produtoId: 1, quantidade: 1001 }] }],
  ["produtoId inválido", { cliente: "Maria", itens: [{ produtoId: "x", quantidade: 1 }] }],
  [
    "produto repetido",
    {
      cliente: "Maria",
      itens: [
        { produtoId: 1, quantidade: 1 },
        { produtoId: 1, quantidade: 2 },
      ],
    },
  ],
  ["JSON malformado", '{"cliente": '],
]) {
  test(`pedido inválido retorna 400 sem consultar produtos: ${descricao}`, async () => {
    const resposta = await criarPedido(servico.url, corpo);
    assert.equal(resposta.status, 400);
    assert.deepEqual(idsRecebidos, []);
  });
}

test("produto inexistente retorna 422, lista os ids e não salva", async () => {
  const resposta = await criarPedido(servico.url, {
    cliente: "Maria",
    itens: [
      { produtoId: 1, quantidade: 1 },
      { produtoId: 888, quantidade: 1 },
    ],
  });
  assert.equal(resposta.status, 422);
  assert.deepEqual((await resposta.json()).produtosNaoEncontrados, [888]);

  const lista = await (await fetch(`${servico.url}/pedidos`)).json();
  assert.equal(lista.total, 0);
});

test("serviço de produtos fora do ar retorna 503 e não salva", async () => {
  await produtos.fechar();

  const resposta = await criarPedido(servico.url, {
    cliente: "Maria",
    itens: [{ produtoId: 1, quantidade: 1 }],
  });
  assert.equal(resposta.status, 503);

  const lista = await (await fetch(`${servico.url}/pedidos`)).json();
  assert.equal(lista.total, 0);
});

test("serviço de produtos travado responde 503 dentro do timeout", async () => {
  const travado = await iniciar(http.createServer(() => {}));
  const app = await novoServico({ produtosUrl: travado.url, timeoutMs: 150 });

  const inicio = Date.now();
  const resposta = await criarPedido(app.url, {
    cliente: "Maria",
    itens: [{ produtoId: 1, quantidade: 1 }],
  });

  assert.equal(resposta.status, 503);
  assert.ok(Date.now() - inicio < 2000, "a requisição não pode ficar pendente");

  await app.fechar();
  await travado.fechar();
});

for (const [descricao, id] of [
  ["erro 500", 500],
  ["JSON inválido", 600],
  ["dados incompletos", 700],
]) {
  test(`${descricao} do serviço de produtos retorna 502`, async () => {
    const resposta = await criarPedido(servico.url, {
      cliente: "Maria",
      itens: [{ produtoId: id, quantidade: 1 }],
    });
    assert.equal(resposta.status, 502);
  });
}

test("GET /pedidos/:id diferencia 200, 400 e 404", async () => {
  await criarPedido(servico.url, {
    cliente: "Maria",
    itens: [{ produtoId: 1, quantidade: 1 }],
  });
  assert.equal((await fetch(`${servico.url}/pedidos/1`)).status, 200);
  assert.equal((await fetch(`${servico.url}/pedidos/2`)).status, 404);
  assert.equal((await fetch(`${servico.url}/pedidos/abc`)).status, 400);
});

test("pedidos continuam disponíveis após reiniciar e os ids não se repetem", async () => {
  await criarPedido(servico.url, {
    cliente: "Maria",
    itens: [{ produtoId: 1, quantidade: 1 }],
  });
  await servico.fechar();

  servico = await novoServico();
  const salvo = await (await fetch(`${servico.url}/pedidos/1`)).json();
  assert.equal(salvo.cliente, "Maria");

  const novo = await (
    await criarPedido(servico.url, {
      cliente: "João",
      itens: [{ produtoId: 1, quantidade: 1 }],
    })
  ).json();
  assert.equal(novo.id, 2);
});

test("arquivo de dados corrompido impede a inicialização sem apagar o conteúdo", () => {
  const corrompido = path.join(pasta, "corrompido.json");
  fs.writeFileSync(corrompido, "{ quebrado");

  assert.throws(
    () => criarApp({ arquivoDados: corrompido, log: () => {} }),
    /Não foi possível ler/
  );
  assert.equal(fs.readFileSync(corrompido, "utf8"), "{ quebrado");
});
