const fs = require("fs").promises;
const path = require("path");
const prettier = require("prettier");
const { Wallet, utils } = require("ethers");
const chalk = require('chalk');
const { ChainId } = require("@biconomy/core-types");

const INIT_CONFIG = {
  privateKey: Wallet.fromMnemonic(
    utils.entropyToMnemonic(utils.randomBytes(32))
  ).mnemonic.phrase,
};

const CONFIG_PATH = path.resolve(__dirname, "../config.json");

const init = async (chainId) => {
  if (chainId === 'mumbai') {
    INIT_CONFIG.chainId = ChainId.POLYGON_MUMBAI;
    INIT_CONFIG.rpcUrl = "https://rpc-mumbai.maticvigil.com";
    INIT_CONFIG.dappAPIKey = "WEX9LXdFW.13107308-4631-4ba5-9e23-2a8bf8270948";
  } else {
    INIT_CONFIG.chainId = ChainId.GOERLI;
    INIT_CONFIG.rpcUrl = "https://rpc.ankr.com/eth_goerli";
    INIT_CONFIG.dappAPIKey = "WEX9LXdFW.13107308-4631-4ba5-9e23-2a8bf8270948";
  }
  fs.writeFile(
    CONFIG_PATH,
    prettier.format(JSON.stringify(INIT_CONFIG, null, 2), { parser: "json" })
  );
  console.log(chalk.green(`Config written to ${CONFIG_PATH}`))
}

module.exports = { init };