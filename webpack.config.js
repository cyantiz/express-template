'use strict'
const path = require('path')

const tsNameof = require('ts-nameof')
const Dotenv = require('dotenv-webpack')
const env = process.env.NODE_ENV || 'development'
const isProd = env === 'production'

module.exports = {
  entry: {
    ['api']: isProd
      ? path.join(__dirname, './src/api/installer.prod.ts')
      : path.join(__dirname, './src/api/installer.dev.ts'),
  },
  output: {
    path: path.join(__dirname, './dist'),
    filename: '[name].js',
    libraryTarget: 'commonjs2',
  },
  mode: isProd ? 'production' : 'development',
  target: 'node',
  externals: [require('webpack-node-externals')()],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'ts-loader',
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: 'ts-loader',
        options: {
          getCustomTransformers: () => ({ before: [tsNameof] }),
        },
      },
      {
        test: /\.pug$/,
        loader: 'pug-loader',
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: 'eslint-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
  },
  plugins: [new Dotenv()],
}
