require("dotenv").config({ quiet: true });
const { criarApp } = require("./app");

const porta = process.env.PORTA || 4001;

criarApp().listen(porta, () => {
  console.log(`Serviço de produtos na porta ${porta}`);
});
