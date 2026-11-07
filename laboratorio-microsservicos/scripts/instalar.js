// Instala as dependências dentro da pasta de cada serviço.
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { RAIZ, SERVICOS } = require("./servicos");

for (const { pasta } of SERVICOS) {
  console.log(`\n=== ${pasta} ===`);
  const resultado = spawnSync("npm install", {
    cwd: path.join(RAIZ, pasta),
    stdio: "inherit",
    shell: true,
  });
  if (resultado.status !== 0) process.exit(resultado.status ?? 1);
}
