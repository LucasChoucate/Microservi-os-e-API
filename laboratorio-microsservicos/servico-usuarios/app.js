const express = require("express");
const { name: SERVICO, version: VERSAO } = require("./package.json");
const {
  criarLogger,
  registrarRequisicoes,
  rotaInexistente,
  tratarErros,
} = require("./observabilidade");

function criarApp({
  apiUrl = "https://jsonplaceholder.typicode.com",
  timeoutMs = 5000,
  log = criarLogger(SERVICO),
} = {}) {
  const app = express();
  app.use(registrarRequisicoes(log));

  function falhaExterna(req, res, erro) {
    log("erro", { requestId: req.id, rota: req.originalUrl, mensagem: erro.message });
    res.status(502).json({ erro: "Serviço externo indisponível" });
  }

  app.get("/status", (req, res) => {
    res.json({ servico: SERVICO, versao: VERSAO, status: "ok" });
  });

  // Atividade 5: lista resumida.
  app.get("/usuarios", async (req, res) => {
    try {
      const resposta = await fetch(`${apiUrl}/users`, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!resposta.ok) throw new Error(`JSONPlaceholder respondeu ${resposta.status}`);

      const usuarios = await resposta.json();
      res.json({
        total: usuarios.length,
        usuarios: usuarios.map((u) => ({
          id: u.id,
          nome: u.name,
          email: u.email,
          cidade: u.address?.city,
        })),
      });
    } catch (erro) {
      falhaExterna(req, res, erro);
    }
  });

  // Atividade 6: detalhes de um usuário.
  app.get("/usuarios/:id", async (req, res) => {
    const { id } = req.params;
    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({ erro: "O id deve ser um inteiro positivo" });
    }

    try {
      const resposta = await fetch(`${apiUrl}/users/${id}`, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (resposta.status === 404) {
        return res.status(404).json({ erro: "Usuário não encontrado" });
      }
      if (!resposta.ok) throw new Error(`JSONPlaceholder respondeu ${resposta.status}`);

      const u = await resposta.json();
      res.json({
        id: u.id,
        nome: u.name,
        usuario: u.username,
        email: u.email,
        telefone: u.phone,
        site: u.website,
        cidade: u.address?.city,
        empresa: u.company?.name,
      });
    } catch (erro) {
      falhaExterna(req, res, erro);
    }
  });

  app.use(rotaInexistente);
  app.use(tratarErros(log));

  return app;
}

module.exports = { criarApp };
