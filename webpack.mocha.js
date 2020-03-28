const buildConfig = require("./webpack.config");
const path = require("path");
const ROOT = __dirname;
const WebpackShellPlugin = require("webpack-shell-plugin-next");
const glob = require("glob");

const IN_WATCH_MODE = process.argv.some(arg => arg === "--watch" || arg === "-w");


const config = {

    entry: glob.sync("./test/**/*.test.ts"),

    mode: "development",
    context: ROOT,
    target: "web",
    devtool: "source-map",
    output: {
        filename: "[name].js",
        path: path.resolve(ROOT, "testbuild")
    },

    resolve: buildConfig.resolve,

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: {
                    loader: "ts-loader",
                    options: {
                        // @todo can not be taken from webpack.config.js
                        configFile: path.resolve(ROOT, "./test/tsconfig.json")
                    }
                }
            }
        ]
    },
    plugins: [
        new WebpackShellPlugin({
            // --exit is required until a fix for non-closed jsdom is found:
            // `dom.window.close()`
            dev: false,
            swallowError: IN_WATCH_MODE,
            onBuildExit: {
                // eslint-disable-next-line max-len
                scripts: ["mocha --exit --require source-map-support/register --require ./test/mocha.setup.js testbuild/main.js"]
            }
        })
    ]
};


module.exports = config;
