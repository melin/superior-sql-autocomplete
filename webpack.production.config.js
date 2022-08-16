var webpack = require('webpack');

module.exports = {
  mode: 'production',

  entry: './src/main.ts',

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
      },
    ],
  },

  resolve: {
    extensions: [
      '.ts', '.js',
    ]
  },

  plugins: [
    new webpack.ProvidePlugin({process: 'process/browser'}),
  ],
}

