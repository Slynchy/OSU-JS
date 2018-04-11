const path = require('path');

// https://github.com/TheHappyKoala/Blast-Off/blob/master/webpack.config.js <3
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const plugins = [
	new HtmlWebpackPlugin({
		template: `${__dirname}/src/index.html`
	})
];

const rules = [];

if (isProduction) {
	// todo
} else {
	publicPath = '';

	//Development plugin
	plugins.push(new webpack.HotModuleReplacementPlugin());
	plugins.push(new webpack.NamedModulesPlugin());

	//Development rules

	rules.push(
		{
			test: /\.less$/,
			use: [
				{
					loader: 'style-loader'
				},
				{
					loader: 'css-loader'
				},
				{
					loader: 'less-loader'
				}
			]
		},
		{
			test: /\.js$/,
			exclude: /node_modules/,
			use: ['babel-loader', 'eslint-loader']
		}
	);
}

module.exports = {
	entry: ['./src/index.js'],
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