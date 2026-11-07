const express = require("express");
const { name: SERVICO, version: VERSAO } = require("./package.json");
const {
  criarLogger,
  registrarRequisicoes,
  rotaInexistente,
  tratarErros,
} = require("./observabilidade");

function lerCoordenada(valor, limite) {
  if (typeof valor !== "string" || !/^-?\d+(\.\d+)?$/.test(valor)) return null;
  const numero = Number(valor);
  return Math.abs(numero) <= limite ? numero : null;
}

// Atividade 9
function criarApp({
  apiUrl = "https://api.open-meteo.com",
  timeoutMs = 5000,
  log = criarLogger(SERVICO),
} = {}) {
  const app = express();
  app.use(registrarRequisicoes(log));

  app.get("/status", (req, res) => {
    res.json({ servico: SERVICO, versao: VERSAO, status: "ok" });
  });

  app.get("/clima", async (req, res) => {
    const latitude = lerCoordenada(req.query.latitude, 90);
    const longitude = lerCoordenada(req.query.longitude, 180);

    if (latitude === null || longitude === null) {
      return res.status(400).json({
        erro: "Informe latitude entre -90 e 90 e longitude entre -180 e 180",
      });
    }

    const consulta = new URLSearchParams({
      latitude,
      longitude,
      current: "temperature_2m,precipitation",
    });

    try {
      const resposta = await fetch(`${apiUrl}/v1/forecast?${consulta}`, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!resposta.ok) throw new Error(`Open-Meteo respondeu ${resposta.status}`);

      const { current } = await resposta.json();
      if (typeof current?.temperature_2m !== "number") {
        throw new Error("Open-Meteo não informou a temperatura");
      }

      res.json({
        latitude,
        longitude,
        horario: current.time,
        temperaturaC: current.temperature_2m,
        precipitacaoMm: current.precipitation,
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
