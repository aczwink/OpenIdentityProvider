module.exports = {
    mode: "production",
    target: "node",
    
    optimization: {
        minimize: false //unfortunately mysqljs requires this
    },

    entry: {
        app: "./src/main.ts",
        management: "./src/cli.ts",
    },
    output: {
        path: __dirname + "/dist",
        filename: "[name].js",
    },
    
    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".js"]
    },

    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "ts-loader"
                    }
                ]
            },
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            /*{
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader"
            },*/
        ]
    },
};