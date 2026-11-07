const { randomUUID } = require("node:crypto");

// Cada linha de log é um JSON com serviço, horário, rota, status e requestId.
function criarLogger(servico) {
  return (nivel, dados) => {
    console.log(
      JSON.stringify({ servico, horario: new Date().toISOString(), nivel, ...dados })
    );
  };
}

// Reaproveita o x-request-id recebido para seguir a mesma chamada entre serviços.
function registrarRequisicoes(log) {
  return (req, res, next) => {
    const recebido = req.get("x-request-id");
    req.id = /^[\w-]{1,64}$/.test(recebido ?? "") ? recebido : randomUUID();
    res.set("x-request-id", req.id);

    const inicio = Date.now();
    res.on("finish", () => {
      const nivel =
        res.statusCode >= 500 ? "erro" : res.statusCode >= 400 ? "aviso" : "info";
      log(nivel, {
        requestId: req.id,
        metodo: req.method,
        rota: req.originalUrl,
        status: res.statusCode,
        duracaoMs: Date.now() - inicio,
      });
    });

    next();
  };
}

function rotaInexistente(req, res) {
  res.status(404).json({ erro: "Rota não encontrada" });
}

function tratarErros(log) {
  return (erro, req, res, next) => {
    if (res.headersSent) return next(erro);

    if (erro.type === "entity.parse.failed") {
      return res.status(400).json({ erro: "JSON inválido" });
    }
    if (erro.type === "entity.too.large") {
      return res.status(413).json({ erro: "Corpo da requisição muito grande" });
    }

    log("erro", { requestId: req.id, rota: req.originalUrl, mensagem: erro.message });
    res.status(500).json({ erro: "Erro interno do servidor" });
  };
}

module.exports = { criarLogger, registrarRequisicoes, rotaInexistente, tratarErros };
