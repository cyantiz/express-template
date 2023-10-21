import * as http from 'http';

export function start(app, port = 5000, socket?) {
  app.set('port', port);

  const server = http.createServer(app);

  //init socket if available
  socket && socket(server);

  server.listen(port);
  server.on('error', onError);
  server.on('listening', onListening);

  function onError(error: {syscall: string; code: any}) {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(`${bind} requires elevated privileges`);
        process.exit(1);
      // eslint-disable-next-line no-fallthrough
      case 'EADDRINUSE':
        console.error(`${bind} is already in use`);
        process.exit(1);
      // eslint-disable-next-line no-fallthrough
      default:
        throw error;
    }
  }

  function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;

    console.log(`Listening on ${bind}`);
  }
}
