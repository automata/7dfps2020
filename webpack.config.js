let path = require('path');

module.exports = {
    entry: {
        'index': './src/index.js',
    },
    output: {
        filename: '[name].js',
        path: path.join(__dirname, 'public'),
    },
    devServer: {
        contentBase: path.join(__dirname, 'public'),
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
          "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
        }
    }
};
