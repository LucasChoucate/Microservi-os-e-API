require("dotenv").config({ quiet: true });
const { criarApp } = require("./app");

const porta = process.env.PORTA || 4002;

const app = criarApp({
  viacepUrl: process.env.VIACEP_URL || undefined,
  timeoutMs: Number(process.env.TIMEOUT_MS) || undefined,
});

app.listen(porta, () => {
  console.log(`Serviço de endereços na porta ${porta}`);
});
