const express = require("express");
const cors = require("cors");
const { name: SERVICO, version: VERSAO } = require("./package.json");
const {
  criarLogger,
  registrarRequisicoes,
  rotaInexistente,
  tratarErros,
} = require("./observabilidade");

const SERVICOS_PADRAO = {
  produtos: "http://localhost:4001",
  enderecos: "http://localhost:4002",
  usuarios: "http://localhost:4003",
  tarefas: "http://localhost:4004",
  clima: "http://localhost:4005",
  pokemon: "http://localhost:4006",
  pedidos: "http://localhost:4007",
};

// Atividade 14: uma única porta de entrada, preservando status e corpo de cada serviço.
function criarApp({
  servicos = SERVICOS_PADRAO,
  // Maior que o timeout dos serviços, para que eles possam responder primeiro.
  timeoutMs = 8000,
  corsOrigem = "*",
  log = criarLogger(SERVICO),
} = {}) {
  const app = express();

  function encaminhar(nome, baseUrl) {
    return async (req, res) => {
      const destino = baseUrl + req.originalUrl.replace(/^\/api/i, "");
      const semCorpo = req.method === "GET" || req.method === "HEAD";

      const cabecalhos = { "x-request-id": req.id };
      if (req.get("content-type")) cabecalhos["content-type"] = req.get("content-type");

      let resposta;
      let corpo;
      try {
        resposta = await fetch(destino, {
          method: req.method,
          headers: cabecalhos,
          body: semCorpo ? undefined : req.body,
          signal: AbortSignal.timeout(timeoutMs),
        });
        corpo = Buffer.from(await resposta.arrayBuffer());
      } catch (erro) {
        const causa = erro.name === "TimeoutError" ? "tempo limite esgotado" : "falha de conexão";
        log("erro", {
          requestId: req.id,
          rota: req.originalUrl,
          mensagem: `Serviço ${nome}: ${causa}`,
        });
        return res.status(503).json({ erro: "Serviço indisponível", servico: nome });
      }

      res.status(resposta.status);
      const tipo = resposta.headers.get("content-type");
      if (tipo) res.set("content-type", tipo);
      const local = resposta.headers.get("location");
      if (local) res.location(`/api${local}`);

      res.end(corpo);
    };
  }

  app.use(registrarRequisicoes(log));
  app.use(cors({ origin: corsOrigem }));

  app.get("/status", (req, res) => {
    res.json({
      servico: SERVICO,
      versao: VERSAO,
      status: "ok",
      rotas: Object.keys(servicos).map((nome) => `/api/${nome}`),
    });
  });

  // Corpo em formato bruto: o gateway repassa sem interpretar, e cada serviço valida o seu.
  app.use("/api", express.raw({ type: () => true, limit: "1mb" }));

  for (const [nome, baseUrl] of Object.entries(servicos)) {
    app.use(`/api/${nome}`, encaminhar(nome, baseUrl));
  }

  app.use(rotaInexistente);
  app.use(tratarErros(log));

  return app;
}

module.exports = { criarApp };
