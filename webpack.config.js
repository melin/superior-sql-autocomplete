const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

module.exports = {
    mode: 'production', // development

    entry: './src/SqlAutComplete.ts',
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "SqlAutComplete.min.js"
    },

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
        new CleanWebpackPlugin({
            cleanAfterEveryBuildPatterns: ['*.LICENSE.txt'],
        })
    ],
}

