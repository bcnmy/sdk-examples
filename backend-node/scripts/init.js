const fs = require("fs").promises;
const path = require("path");
const prettier = require("prettier");
const { Wallet, utils } = require("ethers");

const INIT_CONFIG = {
  chainId: 80001,
  rpcUrl: "https://rpc-mumbai.maticvigil.com",
  privateKey: Wallet.fromMnemonic(
    utils.entropyToMnemonic(utils.randomBytes(32))
  ).mnemonic.phrase,
  dappAPIKey: "59fRCMXvk.8a1652f0-b522-4ea7-b296-98628499aee3",
};
const CONFIG_PATH = path.resolve(__dirname, "../config.json");

async function main() {
  return fs.writeFile(
    CONFIG_PATH,
    prettier.format(JSON.stringify(INIT_CONFIG, null, 2), { parser: "json" })
  );
}

main()
  .then(() => console.log(`Config written to ${CONFIG_PATH}`))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });