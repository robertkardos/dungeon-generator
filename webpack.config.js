var webpack = require('webpack');
var path = require('path');

module.exports = {
	entry: [
		'babel-polyfill',
		'./src/app'
	],
	devtool: 'source-map',
	devServer: {
		contentBase: "./src"
	},
	output: {
		path: './dist',
		publicPath: "/public/",
		filename: 'app.bundle.js'
	},
	// loaders: [
	// 	{
	// 		test: /\.js$/,
	// 		loader: 'babel-loader'
	// 	}
	// ],
	module: {
		loaders: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				loader: 'babel-loader?presets[]=es2015'
			}
		]
	},
	resolve: {
		extensions: ['', '.es6.js', '.js']
	},
	debug: true
};
