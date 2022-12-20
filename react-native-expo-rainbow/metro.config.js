module.exports = {
  resolver: {
    extraNodeModules: {
      crypto: require.resolve("crypto-browserify"),
      url: require.resolve("url"),
      stream: require.resolve("stream-browserify"),
    },
  },
};