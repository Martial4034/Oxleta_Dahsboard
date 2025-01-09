const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  // Other Webpack configurations...
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      // Other rules...
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css",
    }),
    // Other plugins...
  ],
};
