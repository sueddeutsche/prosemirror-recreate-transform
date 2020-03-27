const path = require("path");

const config = {

    entry: [
        "./src/index.ts"
    ],
    mode: "development",
    context: __dirname,
    target: "web",
    devtool: "source-map",
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "dev")
    },

    resolve: {
        extensions: [".tsx", ".ts", ".js"],
        alias: {
            mitt: path.resolve(path.join(__dirname, "./node_modules/mitt/dist/mitt.js")),
            mithril: path.resolve(path.join(__dirname, "./node_modules/mithril")),
            "prosemirror-gapcursor": path.resolve(path.join(__dirname, "./node_modules/prosemirror-gapcursor/src")),
            "prosemirror-model": path.resolve(path.join(__dirname, "./node_modules/prosemirror-model/src")),
            "prosemirror-transform": path.resolve(path.join(__dirname, "./node_modules/prosemirror-transform")),
            editron: path.resolve(path.join(__dirname, "./node_modules/editron")),
            "json-schema-library": path.resolve(path.join(__dirname, "./node_modules/json-schema-library")),
            "@technik-sde/foxy": path.resolve(path.join(__dirname, "./node_modules/@technik-sde/foxy/src/index"))
        }
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
            },
            {
                test: /index\.scss$/,
                use: [
                    "file-loader?name=main.css",
                    "extract-loader",
                    "css-loader",
                    {
                        loader: "sass-loader",
                        options: {
                            sourceMaps: true,
                            includePaths: [
                                path.join(__dirname, "node_modules")
                            ]
                        }
                    }
                ]
            },
            {
                test: /index\.html$/,
                use: [
                    "file-loader?name=index.html",
                    "extract-loader",
                    {
                        loader: "html-loader",
                        options: {
                            interpolate: true,
                            root: encodeURIComponent(__dirname),
                            attrs: ["img:src", "source:srcset", "img:data-src", "video:poster"]
                        }
                    }
                ]
            },
            {
                test: /\.scss$/,
                exclude: /index\.scss$/,
                use: [
                    "style-loader",
                    "css-loader",
                    {
                        loader: "sass-loader",
                        options: {
                            sourceMaps: true,
                            includePaths: [
                                path.join(__dirname, "node_modules")
                            ]
                        }
                    }
                ]
            },
            {
                test: /\.css$/,
                use: [
                    "style-loader",
                    "css-loader"
                ]
            },
            {
                test: /\.jpe?g$|\.gif$|\.png$|\.svg$|\.woff\d?$|\.ttf$|\.eot|\.otf|\.wav$|\.mp3$/,
                use: [
                    {
                        loader: "url-loader",
                        options: {
                            limit: 1000,
                            name: "[name]-[sha256:hash:hex:16].[ext]"
                        }
                    }
                ]
            }
        ]
    },

    devServer: {
        port: 8071,
        disableHostCheck: true,
        host: "0.0.0.0"
    }
};


module.exports = config;
