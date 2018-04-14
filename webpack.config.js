const path = require('path');
//"prettier": "prettier --single-quote --print-width 100 --tab-width 4 --use-tabs \"./src/**/*.js\" --write",

// https://github.com/TheHappyKoala/Blast-Off/blob/master/webpack.config.js <3
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const nodeEnv = process.env.NODE_ENV = 'development';
const isProduction = nodeEnv === 'production';

const plugins = [
    new HtmlWebpackPlugin({
        title: 'Osu!JS'
    })
];

const rules = [
    {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
    },
    {
        test: /\.txt$/,
        use: 'raw-loader'
    },
    {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
    },
    {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: ['babel-loader', 'eslint-loader']
    }
];

publicPath = '';

//Development plugin
plugins.push(new webpack.HotModuleReplacementPlugin());
plugins.push(new webpack.NamedModulesPlugin());
plugins.push(new CopyWebpackPlugin([{
    from: 'src/assets', to: 'assets'
}]));

module.exports = {
    entry: ['babel-polyfill', './src/index.js'],
    module: {
        rules
    },
    resolve: {
        extensions: ['*', '.js', '.jsx']
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath,
        filename: 'main.js'
    },
    plugins,
    devtool: 'source-map',
    node: {
        fs: 'empty',
        net: 'empty'
    },
    devServer: {
        hot: true,
        port: 3000
    }
};