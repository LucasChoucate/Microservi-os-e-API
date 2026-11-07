require("dotenv").config({ quiet: true });
const { criarApp } = require("./app");

const porta = process.env.PORTA || 4000;
const url = (nome, portaPadrao) =>
  process.env[`${nome}_URL`] || `http://localhost:${portaPadrao}`;

const app = criarApp({
  servicos: {
    produtos: url("PRODUTOS", 4001),
    enderecos: url("ENDERECOS", 4002),
    usuarios: url("USUARIOS", 4003),
    tarefas: url("TAREFAS", 4004),
    clima: url("CLIMA", 4005),
    pokemon: url("POKEMON", 4006),
    pedidos: url("PEDIDOS", 4007),
  },
  timeoutMs: Number(process.env.TIMEOUT_MS) || undefined,
  corsOrigem: process.env.CORS_ORIGEM || undefined,
});

app.listen(porta, () => {
  console.log(`Gateway na porta ${porta}`);
});
