// socket.js
let ioInstance = null;

module.exports = {
  /**
   * Initialize socket.io on an http.Server instance.
   * httpServer: instance of Node's http.Server
   * opts: optional Socket.IO Server options
   */
  init: (httpServer, opts = {}) => {
    if (ioInstance) return ioInstance;
    if (!httpServer || typeof httpServer.listen !== 'function') {
      throw new Error('socket.init: http.Server required');
    }
    const { Server } = require('socket.io');
    const defaultOpts = {
      path: opts.path || '/socket.io',
      cors: {
        origin: opts.corsOrigin ?? true,
        methods: ['GET','POST'],
        credentials: true
      },
      ...opts
    };
    ioInstance = new Server(httpServer, defaultOpts);

    // Optional: logging / basic handler
    ioInstance.on('connection', (sock) => {
      console.log('[socket] client connected', sock.id);
      sock.on('disconnect', (r) => console.log('[socket] client disconnected', sock.id, r));
    });

    return ioInstance;
  },

  // get the initialized io instance (or null)
  get: () => ioInstance
};
