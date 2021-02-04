/*
 *  Copyright 2021 Artificial Intelligence Redefined <dev+cogment@ai-r.com>
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */

const webpack = require('webpack');
const ESLintPlugin = require('eslint-webpack-plugin');
const path = require('path');

module.exports = {
  entry: {
    cogment: ['./src/index.ts'],
  },
  target: 'browserslist:last 2 versions',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        include: [path.resolve(__dirname, 'src')],
        exclude: [/node_modules/, /__mocks__/, /__data__/, /dist/],
      },
    ],
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new ESLintPlugin({extensions: ['ts', 'js', '.json']}),
  ],
  resolve: {
    extensions: ['.ts', '.js', '.json'],
  },
};
