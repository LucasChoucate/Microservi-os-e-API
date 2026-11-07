const express = require("express");
const { name: SERVICO, version: VERSAO } = require("./package.json");
const {
  criarLogger,
  registrarRequisicoes,
  rotaInexistente,
  tratarErros,
} = require("./observabilidade");

const CATEGORIAS = ["informatica", "perifericos", "moveis", "geral"];

const PRODUTOS_INICIAIS = [
  { id: 1, nome: "Notebook", preco: 3500, categoria: "informatica" },
  { id: 2, nome: "Monitor 24 polegadas", preco: 899.9, categoria: "informatica" },
  { id: 3, nome: "Teclado mecânico", preco: 249.9, categoria: "perifericos" },
  { id: 4, nome: "Mouse sem fio", preco: 119.5, categoria: "perifericos" },
  { id: 5, nome: "Cadeira de escritório", preco: 799, categoria: "moveis" },
];

function validarProduto(corpo) {
  const dados = corpo && typeof corpo === "object" && !Array.isArray(corpo) ? corpo : {};
  const erros = [];

  const nome = typeof dados.nome === "string" ? dados.nome.trim() : "";
  if (!nome || nome.length > 100) {
    erros.push("nome é obrigatório e deve ter até 100 caracteres");
  }

  if (typeof dados.preco !== "number" || !Number.isFinite(dados.preco) || dados.preco <= 0) {
    erros.push("preco é obrigatório e deve ser um número maior que zero");
  }

  const categoria = dados.categoria ?? "geral";
  if (!CATEGORIAS.includes(categoria)) {
    erros.push(`categoria deve ser uma destas: ${CATEGORIAS.join(", ")}`);
  }

  return { erros, produto: { nome, preco: dados.preco, categoria } };
}

function criarApp({ log = criarLogger(SERVICO) } = {}) {
  const app = express();
  const produtos = PRODUTOS_INICIAIS.map((produto) => ({ ...produto }));
  let proximoId = produtos.length + 1;

  app.use(registrarRequisicoes(log));
  app.use(express.json({ limit: "100kb" }));

  // Atividade 1
  app.get("/status", (req, res) => {
    res.json({ servico: SERVICO, versao: VERSAO, status: "ok" });
  });

  // Atividades 2, 3 e 11
  app.get("/produtos", (req, res) => {
    const { categoria, limite } = req.query;

    if (categoria !== undefined && !CATEGORIAS.includes(categoria)) {
      return res.status(400).json({
        erro: "Categoria inválida",
        categoriasValidas: CATEGORIAS,
      });
    }

    if (limite !== undefined && !/^([1-9]\d?|100)$/.test(String(limite))) {
      return res.status(400).json({ erro: "limite deve ser um inteiro entre 1 e 100" });
    }

    let resultado = produtos;
    if (categoria) resultado = resultado.filter((p) => p.categoria === categoria);
    if (limite) resultado = resultado.slice(0, Number(limite));

    res.json({ total: resultado.length, produtos: resultado });
  });

  // Atividades 4 e 11
  app.post("/produtos", (req, res) => {
    const { erros, produto } = validarProduto(req.body);
    if (erros.length > 0) return res.status(400).json({ erros });

    const novo = { id: proximoId++, ...produto };
    produtos.push(novo);
    res.status(201).location(`/produtos/${novo.id}`).json(novo);
  });

  // Valida o :id de todas as rotas abaixo e localiza o produto.
  app.param("id", (req, res, next, id) => {
    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({ erro: "O id deve ser um inteiro positivo" });
    }
    req.indice = produtos.findIndex((p) => p.id === Number(id));
    if (req.indice === -1) {
      return res.status(404).json({ erro: "Produto não encontrado" });
    }
    next();
  });

  // Atividade 2
  app.get("/produtos/:id", (req, res) => {
    res.json(produtos[req.indice]);
  });

  // Atividade 12
  app.put("/produtos/:id", (req, res) => {
    const { erros, produto } = validarProduto(req.body);
    if (erros.length > 0) return res.status(400).json({ erros });

    produtos[req.indice] = { id: produtos[req.indice].id, ...produto };
    res.json(produtos[req.indice]);
  });

  app.delete("/produtos/:id", (req, res) => {
    produtos.splice(req.indice, 1);
    res.status(204).end();
  });

  app.use(rotaInexistente);
  app.use(tratarErros(log));

  return app;
}

module.exports = { criarApp };
