const path = require('path');
const webpack = require('webpack');

/** @type {import('webpack').Configuration} */
const extensionConfig = {
  target: 'node', // Extensions run in a node context
  mode: 'none', // Leave mode empty to use CLI flag
  entry: {
    extension: './src/extension.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'commonjs',
    devtoolModuleFilenameTemplate: '../[resource-path]',
  },
  externals: {
    vscode: 'commonjs vscode', // The vscode-module is created on-the-fly and must be external
    bufferutil: 'commonjs bufferutil',
    'utf-8-validate': 'commonjs utf-8-validate',
    encoding: 'commonjs encoding',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
        canvas: false
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
          },
        ],
      },
    ],
  },
  devtool: 'source-map',
  infrastructureLogging: {
    level: 'log',
  },
};

/** @type {import('webpack').Configuration} */
const webviewConfig = {
  target: 'web', // Webviews run in a web context
  mode: 'none',
  entry: {
    docxEditor: './src/webview/docx/main.ts',
    xlsxEditor: './src/webview/xlsx/main.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
          },
        ],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  devtool: 'source-map',
};

module.exports = [extensionConfig, webviewConfig];
