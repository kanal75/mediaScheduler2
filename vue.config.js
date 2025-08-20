const { defineConfig } = require("@vue/cli-service");
const webpack = require("webpack");
const CompressionWebpackPlugin = require("compression-webpack-plugin");
const zlib = require("zlib");

module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === "production" ? "/mediascheduler2/" : "/",
  productionSourceMap: false,
  filenameHashing: true,

  devServer: {
    historyApiFallback: true, // Add this line
  },

  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        __VUE_OPTIONS_API__: "true",
        __VUE_PROD_DEVTOOLS__: "false",
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "false",
      }),
      // Generate pre-compressed assets for production. Your server should serve these
      // with the correct Content-Encoding (gzip/br) when the client supports them.
      ...(process.env.NODE_ENV === "production"
        ? [
            new CompressionWebpackPlugin({
              filename: "[path][base].gz",
              algorithm: "gzip",
              test: /\.(js|css|html|svg|json|wasm)$/i,
              threshold: 10240,
              minRatio: 0.8,
              deleteOriginalAssets: false,
              compressionOptions: { level: 9 },
            }),
            new CompressionWebpackPlugin({
              filename: "[path][base].br",
              algorithm: "brotliCompress",
              test: /\.(js|css|html|svg|json|wasm)$/i,
              threshold: 10240,
              minRatio: 0.8,
              deleteOriginalAssets: false,
              compressionOptions: {
                params: {
                  [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
                },
              },
            }),
          ]
        : []),
    ],
  },

  pluginOptions: {},
});
