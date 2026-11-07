// Sobe um app Express ou servidor HTTP em uma porta livre, apenas para os testes.
function iniciar(aplicacao) {
  return new Promise((resolve) => {
    const servidor = aplicacao.listen(0, "127.0.0.1", () => {
      resolve({
        url: `http://127.0.0.1:${servidor.address().port}`,
        fechar: () =>
          new Promise((pronto) => {
            servidor.close(pronto);
            servidor.closeAllConnections();
          }),
      });
    });
  });
}

module.exports = { iniciar };
