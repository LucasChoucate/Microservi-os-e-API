const express = require("express");
const { name: SERVICO, version: VERSAO } = require("./package.json");
const {
  criarLogger,
  registrarRequisicoes,
  rotaInexistente,
  tratarErros,
} = require("./observabilidade");

// Atividade 8
function criarApp({
  apiUrl = "https://jsonplaceholder.typicode.com",
  timeoutMs = 5000,
  log = criarLogger(SERVICO),
} = {}) {
  const app = express();
  app.use(registrarRequisicoes(log));

  app.get("/status", (req, res) => {
    res.json({ servico: SERVICO, versao: VERSAO, status: "ok" });
  });

  app.get("/tarefas", async (req, res) => {
    const { usuario } = req.query;

    if (usuario !== undefined && !/^[1-9]\d*$/.test(String(usuario))) {
      return res.status(400).json({ erro: "usuario deve ser um inteiro positivo" });
    }

    const consulta = usuario ? `?userId=${usuario}` : "";

    try {
      const resposta = await fetch(`${apiUrl}/todos${consulta}`, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!resposta.ok) throw new Error(`JSONPlaceholder respondeu ${resposta.status}`);

      const tarefas = await resposta.json();
      res.json({
        total: tarefas.length,
        tarefas: tarefas.map((t) => ({
          id: t.id,
          usuarioId: t.userId,
          titulo: t.title,
          concluida: t.completed,
        })),
      });
    } catch (erro) {
      log("erro", { requestId: req.id, rota: req.originalUrl, mensagem: erro.message });
      res.status(502).json({ erro: "Serviço externo indisponível" });
    }
  });

  app.use(rotaInexistente);
  app.use(tratarErros(log));

  return app;
}

module.exports = { criarApp };
