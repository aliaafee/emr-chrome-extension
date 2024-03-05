// Based on https://github.com/lxieyang/chrome-extension-boilerplate-react

process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const config = require('../webpack.config');
const ZipPlugin = require('zip-webpack-plugin');

const packageInfo = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

config.plugins = (config.plugins || []).concat(
    new ZipPlugin({
        filename: `${packageInfo.name}-${packageInfo.version}.zip`,
        path: path.join(__dirname, '../', 'dist'),
    })
);

webpack(config, function (err) {
    if (err) throw err;
});