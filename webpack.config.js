var webpack = require('webpack');

module.exports = {
  mode: 'development',

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
    ],
    alias: {
      process: "process/browser"
    } 
  },

  plugins: [
    new webpack.ProvidePlugin({
        process: 'process/browser',
    })
  ],
}

