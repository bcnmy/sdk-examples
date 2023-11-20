#!/usr/bin/env node
import * as yargs from "yargs";
const chalk = require('chalk')
import { init } from "./init.ts";
import { getAddress } from "./address";

import { mintNft } from "./gasless/mintNFT";
import { mintNftPayERC20 } from "./erc20/mintNFT";
import { mintNftNoPaymaster } from "./no-paymaster/mintNFT.ts";

yargs
  .scriptName(chalk.green("smartAccount"))
  .usage("$0 <command> [options]")
  .demandCommand(1, chalk.red.bold("You must specify a command."))
  .recommendCommands()
  // Initialize config file
  .command(
    "init",
    chalk.blue("Create a config file"),
    {
      network: {
        describe: chalk.cyan("Choose chain type"),
        demandOption: false,
        type: "string",
      },
    },
    (argv) => {
      const chainType = argv.network;
      console.log(
        chalk.magenta(`Initializing config for ${chainType} network`)
      );
      init(chainType || "");
    }
  )
  // Get SmartAccount address
  .command("address", chalk.blue("Get counterfactual address"), {}, () => {
    getAddress();
  })
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
      if(argv.mode === "ERC20") {
        mintNftPayERC20();
      }
      else if(argv.mode === "SPONSORED") {
        mintNft();
      } else {
        mintNftNoPaymaster();
      }
    }
  )
  .help().argv;
