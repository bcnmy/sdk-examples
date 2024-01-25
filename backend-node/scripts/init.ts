const fs = require("fs").promises;
import path from "path";
import prettier from "prettier";
import { Wallet, utils } from "ethers";
const chalk = require('chalk')
import { ChainId } from "@biconomy/core-types";
import { RPC_PROVIDER_URLS } from "@biconomy/common";

let index = 500000;
const INIT_CONFIG: any = {
  privateKey: Wallet.fromMnemonic(
    utils.entropyToMnemonic(utils.randomBytes(32)),
    `m/44'/60'/0'/0/${index}`
  ).privateKey.substring(2),
};

const CONFIG_PATH = path.resolve(__dirname, "../config.json");

INIT_CONFIG.accountIndex = 0;

export const init = async (chainId: string) => {
  console.log("network is ------", chainId);
  if (chainId === "mumbai") {
    INIT_CONFIG.chainId = ChainId.POLYGON_MUMBAI;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.POLYGON_MUMBAI];
    INIT_CONFIG.bundlerUrl =
    `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/cJPK7B3ru.dd7f7861-190d-45ic-af80-6877f74b8f44`;
    INIT_CONFIG.biconomyPaymasterUrl =
    `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/<YOUR_PAYMASTER_API_KEY_FROM_DASHBOARD>`;
  } else if (chainId === "ethereum") {
    INIT_CONFIG.chainId = ChainId.MAINNET;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.MAINNET];
    INIT_CONFIG.bundlerUrl =
    `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/<BUNDLER_API_KEY_OBTAINED_FROM_BICONOMY>`;
    INIT_CONFIG.biconomyPaymasterUrl =
    `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/<YOUR_PAYMASTER_API_KEY_FROM_DASHBOARD>`;
  } else if (chainId === "goerli") {
    INIT_CONFIG.chainId = ChainId.GOERLI;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.GOERLI];
    INIT_CONFIG.bundlerUrl =
    `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/cJPK7B3ru.dd7f7861-190d-45ic-af80-6877f74b8f44`;
    INIT_CONFIG.biconomyPaymasterUrl =
    `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/<YOUR_PAYMASTER_API_KEY_FROM_DASHBOARD>`;
  } else if (chainId === "polygon") {
    INIT_CONFIG.chainId = ChainId.POLYGON_MAINNET;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.POLYGON_MAINNET];
    INIT_CONFIG.bundlerUrl =
    `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/<BUNDLER_API_KEY_OBTAINED_FROM_BICONOMY>`;
    INIT_CONFIG.biconomyPaymasterUrl =
    `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/<YOUR_PAYMASTER_API_KEY_FROM_DASHBOARD>`;
  } else if (chainId === "bsc-testnet") {
    INIT_CONFIG.chainId = ChainId.BSC_TESTNET;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.BSC_TESTNET];
    INIT_CONFIG.bundlerUrl =
    `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/cJPK7B3ru.dd7f7861-190d-45ic-af80-6877f74b8f44`;
    INIT_CONFIG.biconomyPaymasterUrl =
    `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/<YOUR_PAYMASTER_API_KEY_FROM_DASHBOARD>`;
  } else if (chainId === "bsc") {
    INIT_CONFIG.chainId = ChainId.BSC_MAINNET;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.BSC_MAINNET];
    INIT_CONFIG.bundlerUrl =
    `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/<BUNDLER_API_KEY_OBTAINED_FROM_BICONOMY>`;
    INIT_CONFIG.biconomyPaymasterUrl =
    `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/<YOUR_PAYMASTER_API_KEY_FROM_DASHBOARD>`;
  } else if (chainId === "polygon-zkevm-testnet") {
    INIT_CONFIG.chainId = ChainId.POLYGON_ZKEVM_TESTNET;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.POLYGON_ZKEVM_TESTNET];
    INIT_CONFIG.bundlerUrl =
    `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/cJPK7B3ru.dd7f7861-190d-45ic-af80-6877f74b8f44`;
    INIT_CONFIG.biconomyPaymasterUrl =
    `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/<YOUR_PAYMASTER_API_KEY_FROM_DASHBOARD>`;
  } else if (chainId === "polygon-zkevm") {
    INIT_CONFIG.chainId = ChainId.POLYGON_ZKEVM_MAINNET;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.POLYGON_ZKEVM_MAINNET];
    INIT_CONFIG.bundlerUrl =
    `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/<BUNDLER_API_KEY_OBTAINED_FROM_BICONOMY>`;
    INIT_CONFIG.biconomyPaymasterUrl =
    `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/<YOUR_PAYMASTER_API_KEY_FROM_DASHBOARD>`;
  } else if (chainId === "arbitrum-goerli-testnet") {
    INIT_CONFIG.chainId = ChainId.ARBITRUM_GOERLI_TESTNET;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.ARBITRUM_GOERLI_TESTNET];
    INIT_CONFIG.bundlerUrl =
    `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/cJPK7B3ru.dd7f7861-190d-45ic-af80-6877f74b8f44`;
    INIT_CONFIG.biconomyPaymasterUrl =
    `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/<YOUR_PAYMASTER_API_KEY_FROM_DASHBOARD>`;
  } else if (chainId === "arbitrum-one-mainnet") {
    INIT_CONFIG.chainId = ChainId.ARBITRUM_ONE_MAINNET;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.ARBITRUM_ONE_MAINNET];
    INIT_CONFIG.bundlerUrl =
    `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/<BUNDLER_API_KEY_OBTAINED_FROM_BICONOMY>`;
    INIT_CONFIG.biconomyPaymasterUrl =
    `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/<YOUR_PAYMASTER_API_KEY_FROM_DASHBOARD>`;
  } else if (chainId === "arbitrum-nova-mainnet") {
    INIT_CONFIG.chainId = ChainId.ARBITRUM_NOVA_MAINNET;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.ARBITRUM_NOVA_MAINNET];
    INIT_CONFIG.bundlerUrl =
    `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/<BUNDLER_API_KEY_OBTAINED_FROM_BICONOMY>`;
    INIT_CONFIG.biconomyPaymasterUrl =
    `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/<YOUR_PAYMASTER_API_KEY_FROM_DASHBOARD>`;
  } else if (chainId === "sepolia") {
    INIT_CONFIG.chainId = ChainId.SEPOLIA;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.SEPOLIA];
    INIT_CONFIG.bundlerUrl =
    `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/<BUNDLER_API_KEY_OBTAINED_FROM_BICONOMY>`;
    INIT_CONFIG.biconomyPaymasterUrl =
    `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/<YOUR_PAYMASTER_API_KEY_FROM_DASHBOARD>`;
  } else if (chainId === "base-goerli") {
    INIT_CONFIG.chainId = ChainId.BASE_GOERLI_TESTNET;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.BASE_GOERLI_TESTNET];
    INIT_CONFIG.bundlerUrl =
    `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/<BUNDLER_API_KEY_OBTAINED_FROM_BICONOMY>`;
    INIT_CONFIG.biconomyPaymasterUrl =
    `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/<YOUR_PAYMASTER_API_KEY_FROM_DASHBOARD>`;
  } else if (chainId === "base-mainnet") {
    INIT_CONFIG.chainId = ChainId.BASE_MAINNET;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.BASE_MAINNET];
    INIT_CONFIG.bundlerUrl =
    `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/<BUNDLER_API_KEY_OBTAINED_FROM_BICONOMY>`;
    INIT_CONFIG.biconomyPaymasterUrl =
    `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/<YOUR_PAYMASTER_API_KEY_FROM_DASHBOARD>`;
  } else if (chainId === "arbitrum-sepolia-testnet") {
    INIT_CONFIG.chainId = ChainId.ARBITRUM_SEPOLIA;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.ARBITRUM_SEPOLIA];
    INIT_CONFIG.bundlerUrl =
    `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/<BUNDLER_API_KEY_OBTAINED_FROM_BICONOMY>`;
    INIT_CONFIG.biconomyPaymasterUrl =
    `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/<YOUR_PAYMASTER_API_KEY_FROM_DASHBOARD>`;
  } else if (chainId === "linea-goerli") {
    INIT_CONFIG.chainId = ChainId.LINEA_TESTNET;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.LINEA_TESTNET];
    INIT_CONFIG.bundlerUrl =
    `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/<BUNDLER_API_KEY_OBTAINED_FROM_BICONOMY>`;
    INIT_CONFIG.biconomyPaymasterUrl =
    `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/<YOUR_PAYMASTER_API_KEY_FROM_DASHBOARD>`;
  } else if (chainId === "linea-mainnet") {
    INIT_CONFIG.chainId = ChainId.LINEA_MAINNET;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.LINEA_MAINNET];
    INIT_CONFIG.bundlerUrl =
    `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/<BUNDLER_API_KEY_OBTAINED_FROM_BICONOMY>`;
    INIT_CONFIG.biconomyPaymasterUrl =
    `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/<YOUR_PAYMASTER_API_KEY_FROM_DASHBOARD>`;
  } else if (chainId === "optimism-testnet") {
    INIT_CONFIG.chainId = ChainId.OPTIMISM_GOERLI_TESTNET;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.OPTIMISM_GOERLI_TESTNET];
    INIT_CONFIG.bundlerUrl =
    `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/<BUNDLER_API_KEY_OBTAINED_FROM_BICONOMY>`;
    INIT_CONFIG.biconomyPaymasterUrl =
    `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/<YOUR_PAYMASTER_API_KEY_FROM_DASHBOARD>`;
  } else if (chainId === "optimism-mainnet") {
    INIT_CONFIG.chainId = ChainId.OPTIMISM_MAINNET;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.OPTIMISM_MAINNET];
    INIT_CONFIG.bundlerUrl =
    `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/<BUNDLER_API_KEY_OBTAINED_FROM_BICONOMY>`;
    INIT_CONFIG.biconomyPaymasterUrl =
    `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/<YOUR_PAYMASTER_API_KEY_FROM_DASHBOARD>`;
  } else if (chainId === "avalanche-testnet") {
    INIT_CONFIG.chainId = ChainId.AVALANCHE_TESTNET;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.AVALANCHE_TESTNET];
    INIT_CONFIG.bundlerUrl =
    `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/<BUNDLER_API_KEY_OBTAINED_FROM_BICONOMY>`;
    INIT_CONFIG.biconomyPaymasterUrl =
    `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/<YOUR_PAYMASTER_API_KEY_FROM_DASHBOARD>`;
  } else if (chainId === "avalanche-mainnet") {
    INIT_CONFIG.chainId = ChainId.AVALANCHE_MAINNET;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.AVALANCHE_MAINNET];
    INIT_CONFIG.bundlerUrl =
    `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/<BUNDLER_API_KEY_OBTAINED_FROM_BICONOMY>`;
    INIT_CONFIG.biconomyPaymasterUrl =
    `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/<YOUR_PAYMASTER_API_KEY_FROM_DASHBOARD>`;
  }
  else {
    throw new Error("Invalid network type for quickstart. If the chain is supported you can manually update config.json");
  }
  INIT_CONFIG.preferredToken = "";
  INIT_CONFIG.tokenList = [];
  INIT_CONFIG.numOfParallelUserOps = 1;
  fs.writeFile(
    CONFIG_PATH,
    prettier.format(JSON.stringify(INIT_CONFIG, null, 2), { parser: "json" })
  );
  console.log(chalk.green(`Config written to ${CONFIG_PATH}`));
};
