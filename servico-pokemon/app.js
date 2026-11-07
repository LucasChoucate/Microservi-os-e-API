const express = require("express");
const { name: SERVICO, version: VERSAO } = require("./package.json");
const {
  criarLogger,
  registrarRequisicoes,
  rotaInexistente,
  tratarErros,
} = require("./observabilidade");

// Atividade 10
function criarApp({
  apiUrl = "https://pokeapi.co",
  timeoutMs = 5000,
  log = criarLogger(SERVICO),
} = {}) {
  const app = express();
  app.use(registrarRequisicoes(log));

  app.get("/status", (req, res) => {
    res.json({ servico: SERVICO, versao: VERSAO, status: "ok" });
  });

  app.get("/pokemon/:id", async (req, res) => {
    const { id } = req.params;
    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({ erro: "O id deve ser um inteiro positivo" });
    }

    try {
      const resposta = await fetch(`${apiUrl}/api/v2/pokemon/${id}`, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (resposta.status === 404) {
        return res.status(404).json({ erro: "Personagem não encontrado" });
      }
      if (!resposta.ok) throw new Error(`PokéAPI respondeu ${resposta.status}`);

      const dados = await resposta.json();
      res.json({
        id: dados.id,
        nome: dados.name,
        tipos: dados.types.map((t) => t.type.name),
        habilidades: dados.abilities.map((h) => h.ability.name),
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
