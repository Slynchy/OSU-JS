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
        template: './src/index.html'
    })
];

const rules = [
    {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
    },
    {
        test: /\.(txt|osu)$/,
        use: 'raw-loader'
    },
	{
		test: /\.(js|jsx)$/,
		exclude: /node_modules/,
		loader: 'babel-loader',
		options: {
			presets: ['es2015'],
		}
	},
	{
		test: /\.(js)$/,
		exclude: /node_modules/,
		loader: 'eslint-loader',
		enforce: 'pre',
		options: {
			fix: true
		}
	},
	{
		test: /\.ttf$/,
		use: [
			{
				loader: 'ttf-loader',
				options: {
					name: './font/[hash].[ext]',
				},
			},
		]
	}
];

publicPath = '';

//Development plugin
plugins.push(new webpack.HotModuleReplacementPlugin());
plugins.push(new webpack.NamedModulesPlugin());
plugins.push(new CopyWebpackPlugin([
    {
        from: 'src/assets', to: 'assets'
    },
    {
        from: 'src/fbapp-config.json', to: 'fbapp-config.json'
    }
]));

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
        port: 3000,
        overlay: true,
        stats: "minimal"
    }
};