const TerserPlugin = require("terser-webpack-plugin");
const path = require("path");
const PRODUCTION = process.argv.some(arg => arg === "-p" || arg === "--production");


const config = {
    entry: ["./src/index.ts"],
    mode: PRODUCTION ? "production" : "development",
    context: __dirname,
    target: "node",
    devtool: "source-map",
    output: {
        filename: "recreateTransform.js",
        path: path.resolve(__dirname, PRODUCTION ? "dist" : "dev"),
        library: "recreateTransform",
        libraryTarget: "umd"
    },

    resolve: {
        extensions: [".tsx", ".ts", ".js"],
        alias: {}
    },

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: {
                    loader: "ts-loader",
                    options: {
                        configFile: path.resolve(__dirname, "tsconfig.json")
                    }
                }
            }
        ]
    },

    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    "keep_fnames": true
                }
            })
        ]
    },

    externals: {
        'prosemirror-model': 'prosemirror-model',
        'prosemirror-transform': 'prosemirror-transform'
    }
};

module.exports = config;
