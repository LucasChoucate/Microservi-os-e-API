require("dotenv").config({ quiet: true });
const { criarApp } = require("./app");

const porta = process.env.PORTA || 4005;

const app = criarApp({
  apiUrl: process.env.OPEN_METEO_URL || undefined,
  timeoutMs: Number(process.env.TIMEOUT_MS) || undefined,
});

app.listen(porta, () => {
  console.log(`Serviço de clima na porta ${porta}`);
});
