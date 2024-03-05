process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

const PORT = process.env.PORT || 3000;

const WebpackDevServer = require('webpack-dev-server');
const Webpack = require('webpack');
const path = require("path");
const config = require('../webpack.config');

config.mode = 'development';

config.devtool = 'cheap-module-source-map';

// Hide errors due to large size of development bundle
config.performance = {
    hints: false
};

const compiler = Webpack(config);

var server = new WebpackDevServer(
    {
        hot: true,
        liveReload: false,
        client: {
            webSocketTransport: 'sockjs',
        },
        webSocketServer: 'sockjs',
        host: 'localhost',
        port: PORT,
        static: {
            directory: path.join(__dirname, '../build'),
        },
        devMiddleware: {
            publicPath: `http://localhost:${PORT}/`,
            writeToDisk: true,
        },
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        allowedHosts: 'all',
    },
    compiler
);

(async () => {
    await server.start();
})();