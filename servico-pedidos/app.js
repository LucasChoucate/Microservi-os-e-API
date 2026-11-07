const express = require("express");
const path = require("node:path");
const { name: SERVICO, version: VERSAO } = require("./package.json");
const { criarRepositorio } = require("./repositorio");
const {
  criarLogger,
  registrarRequisicoes,
  rotaInexistente,
  tratarErros,
} = require("./observabilidade");

const MAX_ITENS = 50;
const MAX_QUANTIDADE = 1000;

// Separa as falhas do serviço de produtos para escolher entre 503 e 502.
class ProdutosIndisponivel extends Error {}
class RespostaInvalida extends Error {}

function causaDaFalha(erro) {
  return erro.name === "TimeoutError" ? "tempo limite esgotado" : "falha de conexão";
}

function validarPedido(corpo) {
  const dados = corpo && typeof corpo === "object" && !Array.isArray(corpo) ? corpo : {};
  const erros = [];

  const cliente = typeof dados.cliente === "string" ? dados.cliente.trim() : "";
  if (!cliente || cliente.length > 100) {
    erros.push("cliente é obrigatório e deve ter até 100 caracteres");
  }

  const itens = dados.itens;
  if (!Array.isArray(itens) || itens.length === 0 || itens.length > MAX_ITENS) {
    erros.push(`itens deve ser uma lista com 1 a ${MAX_ITENS} produtos`);
    return { erros };
  }

  const vistos = new Set();
  itens.forEach((item, posicao) => {
    if (!Number.isInteger(item?.produtoId) || item.produtoId < 1) {
      erros.push(`itens[${posicao}].produtoId deve ser um inteiro positivo`);
    } else if (vistos.has(item.produtoId)) {
      erros.push(`itens[${posicao}].produtoId repete o produto ${item.produtoId}`);
    }
    vistos.add(item?.produtoId);

    if (
      !Number.isInteger(item?.quantidade) ||
      item.quantidade < 1 ||
      item.quantidade > MAX_QUANTIDADE
    ) {
      erros.push(`itens[${posicao}].quantidade deve ser um inteiro de 1 a ${MAX_QUANTIDADE}`);
    }
  });

  return { erros, cliente, itens };
}

function criarApp({
  produtosUrl = "http://localhost:4001",
  timeoutMs = 3000,
  arquivoDados = path.join(__dirname, "dados", "pedidos.json"),
  log = criarLogger(SERVICO),
} = {}) {
  const app = express();
  const repositorio = criarRepositorio(arquivoDados);

  // Devolve o produto, ou null se o serviço de produtos responder 404.
  async function buscarProduto(id, requestId) {
    let resposta;
    try {
      resposta = await fetch(`${produtosUrl}/produtos/${id}`, {
        headers: { "x-request-id": requestId },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (erro) {
      throw new ProdutosIndisponivel(`Serviço de produtos: ${causaDaFalha(erro)}`);
    }

    if (resposta.status === 404) return null;
    if (!resposta.ok) throw new RespostaInvalida(`Produtos respondeu ${resposta.status}`);

    let produto;
    try {
      produto = await resposta.json();
    } catch (erro) {
      if (erro.name === "TimeoutError") {
        throw new ProdutosIndisponivel(`Serviço de produtos: ${causaDaFalha(erro)}`);
      }
      throw new RespostaInvalida("Produtos devolveu um JSON inválido");
    }
    if (typeof produto?.preco !== "number" || typeof produto?.nome !== "string") {
      throw new RespostaInvalida("Produtos devolveu dados incompletos");
    }
    return produto;
  }

  app.use(registrarRequisicoes(log));
  app.use(express.json({ limit: "100kb" }));

  app.get("/status", (req, res) => {
    res.json({ servico: SERVICO, versao: VERSAO, status: "ok" });
  });

  app.get("/pedidos", (req, res) => {
    const pedidos = repositorio.listar();
    res.json({ total: pedidos.length, pedidos });
  });

  app.get("/pedidos/:id", (req, res) => {
    const { id } = req.params;
    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({ erro: "O id deve ser um inteiro positivo" });
    }

    const pedido = repositorio.buscar(Number(id));
    if (!pedido) return res.status(404).json({ erro: "Pedido não encontrado" });
    res.json(pedido);
  });

  // Atividade 20: consulta produtos, valida existência, calcula o total e salva.
  app.post("/pedidos", async (req, res) => {
    const { erros, cliente, itens } = validarPedido(req.body);
    if (erros.length > 0) return res.status(400).json({ erros });

    let produtos;
    try {
      produtos = await Promise.all(itens.map((i) => buscarProduto(i.produtoId, req.id)));
    } catch (erro) {
      log("erro", { requestId: req.id, rota: req.originalUrl, mensagem: erro.message });

      if (erro instanceof ProdutosIndisponivel) {
        return res.status(503).json({ erro: "Serviço de produtos indisponível" });
      }
      if (erro instanceof RespostaInvalida) {
        return res.status(502).json({ erro: "Resposta inválida do serviço de produtos" });
      }
      throw erro;
    }

    const naoEncontrados = itens
      .filter((_, posicao) => produtos[posicao] === null)
      .map((item) => item.produtoId);

    if (naoEncontrados.length > 0) {
      return res.status(422).json({
        erro: "Há produtos inexistentes no pedido",
        produtosNaoEncontrados: naoEncontrados,
      });
    }

    // O cálculo em centavos evita erros de arredondamento (0,1 + 0,2 = 0,30000000000000004).
    let totalCentavos = 0;
    const itensDoPedido = itens.map((item, posicao) => {
      const produto = produtos[posicao];
      const subtotalCentavos = Math.round(produto.preco * 100) * item.quantidade;
      totalCentavos += subtotalCentavos;

      return {
        produtoId: produto.id,
        nome: produto.nome,
        precoUnitario: produto.preco,
        quantidade: item.quantidade,
        subtotal: subtotalCentavos / 100,
      };
    });

    const pedido = repositorio.adicionar({
      cliente,
      itens: itensDoPedido,
      valorTotal: totalCentavos / 100,
      criadoEm: new Date().toISOString(),
    });

    res.status(201).location(`/pedidos/${pedido.id}`).json(pedido);
  });

  app.use(rotaInexistente);
  app.use(tratarErros(log));

  return app;
}

module.exports = { criarApp };
