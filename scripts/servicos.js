const path = require("node:path");

const RAIZ = path.resolve(__dirname, "..");

const SERVICOS = [
  { pasta: "servico-produtos", porta: 4001 },
  { pasta: "servico-enderecos", porta: 4002 },
  { pasta: "servico-usuarios", porta: 4003 },
  { pasta: "servico-tarefas", porta: 4004 },
  { pasta: "servico-clima", porta: 4005 },
  { pasta: "servico-pokemon", porta: 4006 },
  { pasta: "servico-pedidos", porta: 4007 },
  { pasta: "gateway", porta: 4000 },
];

module.exports = { RAIZ, SERVICOS };
