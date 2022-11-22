module.exports = {
  resolver: {
    extraNodeModules: {
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
    },
  },
};