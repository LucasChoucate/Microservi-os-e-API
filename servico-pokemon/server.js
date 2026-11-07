require("dotenv").config({ quiet: true });
const { criarApp } = require("./app");

const porta = process.env.PORTA || 4006;

const app = criarApp({
  apiUrl: process.env.POKEAPI_URL || undefined,
  timeoutMs: Number(process.env.TIMEOUT_MS) || undefined,
});

app.listen(porta, () => {
  console.log(`Serviço de personagens na porta ${porta}`);
});
