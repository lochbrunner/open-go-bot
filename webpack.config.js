var webpack = require('webpack');
var path = require('path');

// variables
var isProduction = process.argv.indexOf('-p') >= 0;
var sourcePath = path.join(__dirname, './client');
var outPath = path.join(__dirname, './www');

// plugins
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

const extractSass = new ExtractTextPlugin({
  filename: "[name].[contenthash].css",
  disable: process.env.NODE_ENV === "development"
});

module.exports = {
  context: sourcePath,
  entry: {
    main: './index.tsx',
    vendor: ['react', 'react-dom', 'react-redux', 'react-router', 'redux']
  },
  output: {
    path: outPath,
    publicPath: '/',
    filename: 'bundle.js',
  },
  target: 'web',
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
    // Fix webpack's default behavior to not load packages with jsnext:main
    // module
    // https://github.com/Microsoft/TypeScript/issues/11677
    mainFields: ['main'],
    alias: {inherits$: path.resolve(__dirname, 'node_modules/inherits')}
  },
  module: {
    loaders: [
      // for ploty.js
      {test: /\.js$/, loader: 'ify-loader'},
      // .ts, .tsx
      {
        test: /\.tsx?$/,
        use: isProduction ? 'awesome-typescript-loader?module=es6' :
                            ['react-hot-loader', 'awesome-typescript-loader']
      },
      // scss
      {
        test: /\.scss$/,
        use:
          extractSass.extract({
            use: [{loader: "css-loader"}, {loader: "sass-loader"}],
            // use style-loader in development
            fallback: "style-loader"
          })
          // {
          //   loader: "style-loader"
          // },
          // {
          //   loader: 'css-loader',
          //   options: {
          //     sourceMap: true
          //   }
          //   // query: {
          //   //   modules: true,
          //   //   sourceMap: !isProduction,
          //   //   importLoaders: 1,
          //   //   localIdentName: '[local]__[hash:base64:5]'
          //   // }
          // },
          // {
          //   loader: "sass-loader", // compiles Sass to CSS
          //   options: {
          //     sourceMap: true
          //   }
          // }
        // ]
      },
      // static assets
      {test: /\.html$/, use: 'html-loader'},
      {test: /\.png$/, use: 'url-loader?limit=10000'},
      {test: /\.jpg$/, use: 'file-loader'},
      {test: /\.ttf$/, use: 'file-loader'},
      {test: /\.woff2$/, use: 'file-loader'},
      {test: /\.woff$/, use: 'file-loader'},
      {test: /\.eot$/, use: 'file-loader'},
      {test: /\.svg$/, use: 'file-loader'},
    ],
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin(
        {name: 'vendor', filename: 'vendor.bundle.js', minChunks: Infinity}),
    new webpack.optimize.AggressiveMergingPlugin(),
    new ExtractTextPlugin({
      filename: 'styles.css',
      // disable: !isProduction
    }),
    new HtmlWebpackPlugin({
      template: 'index.html', 
      favicon: './assets/favicon.ico'
    }),
    extractSass
  ],
  devtool: "source-map",
  devServer: {
    contentBase: sourcePath,
    hot: true,
    stats: {warnings: false},
  },
  node: {
    // workaround for webpack-dev-server issue
    // https://github.com/webpack/webpack-dev-server/issues/60#issuecomment-103411179
    fs: 'empty',
    net: 'empty'
  },
  // externals: [{
  //   xmlhttprequest: '{XMLHttpRequest:XMLHttpRequest}'
  // }]
};
