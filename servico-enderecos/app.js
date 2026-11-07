const express = require("express");
const { name: SERVICO, version: VERSAO } = require("./package.json");
const {
  criarLogger,
  registrarRequisicoes,
  rotaInexistente,
  tratarErros,
} = require("./observabilidade");

// Atividade 7: segue o exemplo guiado do roteiro.
function criarApp({
  viacepUrl = "https://viacep.com.br",
  timeoutMs = 5000,
  log = criarLogger(SERVICO),
} = {}) {
  const app = express();
  app.use(registrarRequisicoes(log));

  app.get("/status", (req, res) => {
    res.json({ servico: SERVICO, versao: VERSAO, status: "ok" });
  });

  app.get("/enderecos/:cep", async (req, res) => {
    const cep = req.params.cep.replace(/\D/g, "");

    if (!/^\d{8}$/.test(cep)) {
      return res.status(400).json({ erro: "CEP deve conter 8 dígitos" });
    }

    try {
      const resposta = await fetch(`${viacepUrl}/ws/${cep}/json/`, {
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!resposta.ok) {
        throw new Error(`ViaCEP respondeu ${resposta.status}`);
      }

      const dados = await resposta.json();

      if (dados.erro) {
        return res.status(404).json({ erro: "CEP não encontrado" });
      }

      res.json({
        cep: dados.cep,
        logradouro: dados.logradouro,
        bairro: dados.bairro,
        cidade: dados.localidade,
        uf: dados.uf,
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
