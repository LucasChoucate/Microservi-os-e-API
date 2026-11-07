require("dotenv").config({ quiet: true });
const { criarApp } = require("./app");

const porta = process.env.PORTA || 4004;

const app = criarApp({
  apiUrl: process.env.JSONPLACEHOLDER_URL || undefined,
  timeoutMs: Number(process.env.TIMEOUT_MS) || undefined,
});

app.listen(porta, () => {
  console.log(`Serviço de tarefas na porta ${porta}`);
});
