// Sobe cada serviço em um processo independente. Ctrl+C encerra todos.
const { spawn } = require("node:child_process");
const path = require("node:path");
const { RAIZ, SERVICOS } = require("./servicos");

const processos = SERVICOS.map(({ pasta }) => {
  const filho = spawn(process.execPath, ["server.js"], {
    cwd: path.join(RAIZ, pasta),
    stdio: ["ignore", "inherit", "inherit"],
  });
  filho.on("exit", (codigo) => {
    if (codigo) console.error(`${pasta} encerrou com o código ${codigo}`);
  });
  return filho;
});

function encerrar() {
  processos.forEach((filho) => filho.kill());
  process.exit(0);
}

process.on("SIGINT", encerrar);
process.on("SIGTERM", encerrar);
