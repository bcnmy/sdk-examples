#!/usr/bin/env node
import * as yargs from "yargs";
const chalk = require("chalk");
// import { getAddress } from "./address";
import { mintNft } from "./gasless/mintNFT";
yargs
  .scriptName(chalk.green("smartAccount"))
  .usage("$0 <command> [options]")
  .demandCommand(1, chalk.red.bold("You must specify a command."))
  .recommendCommands()
  // Get SmartAccount address
  // .command("address", chalk.blue("Get counterfactual address"), {}, () => {
  //   getAddress();
  // })
  // Mint nft token to SmartAccount
  .command(
    "mint",
    chalk.blue("Mint nft token"),
    {
      mode: {
        describe: chalk.cyan("Paymaster mode"),
        demandOption: false,
        type: "string",
      },
    },
    (argv) => {
      console.log(chalk.magenta("Minting an NFT token to the SmartAccount..."));
      mintNft();
    }
  )
  .help().argv;
