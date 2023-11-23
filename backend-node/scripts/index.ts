#!/usr/bin/env node
import * as yargs from "yargs";
const chalk = require('chalk')
import { init } from "./init.ts";
import { getAddress } from "./address";
import { nativeTransfer } from "./gasless/nativeTransfer";
import { nativeTransferPayERC20 } from "./erc20/nativeTransfer";
import { erc20Transfer } from "./gasless/erc20Transfer";
import { erc20TransferPayERC20 } from "./erc20/erc20Transfer";
import { mintNft } from "./gasless/mintNFT";
import { parallelUserOpsMintNft } from "./gasless/parallelUserOpsMintNFT.ts"
import { mintNftPayERC20 } from "./erc20/mintNFT";
import { parallelUserOpsMintNFTPayERC20 } from './erc20/parallelUserOpsMintNFT.ts';
import { batchMintNft } from "./gasless/batchMintNFT";
import { batchMintNftPayERC20 } from "./erc20/batchMintNFT";
import { batchMintNftTrySponsorshipOtherwisePayERC20 } from "./hybrid-fallback/batchMintNFT";
import { mintNftTrySponsorshipOtherwisePayERC20 } from "./hybrid-fallback/mintNFT";
import { multiChainMint } from "./gasless/multiChainMint.ts";

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
  // Transfer native assets (ether/matic)
  .command(
    "transfer",
    chalk.blue("Transfer native (ether/matic)"),
    {
      to: {
        describe: chalk.cyan("Recipient address"),
        demandOption: true,
        type: "string",
      },
      amount: {
        describe: chalk.cyan("Amount of ether to transfer"),
        demandOption: true,
        type: "number",
      },
      mode: {
        describe: chalk.cyan("Paymaster mode"),
        demandOption: false,
        type: "string",
      },
    },
    (argv) => {
      const amount = argv.amount;
      const recipientAddress = argv.to;
      console.log(
        chalk.magenta(`Transferring ${amount} ether to ${recipientAddress}...`)
      );
      if(argv.mode === "TOKEN") {
        nativeTransferPayERC20(
          recipientAddress,
          amount
        );
      }
      else {
        nativeTransfer(
          recipientAddress,
          amount
        );
      }
    }
  )
  // Transfer an ERC20 token
  .command(
    "erc20Transfer",
    chalk.blue("Transfer an ERC20 token"),
    {
      to: {
        describe: chalk.cyan("Recipient address"),
        demandOption: true,
        type: "string",
      },
      amount: {
        describe: chalk.cyan("Amount of tokens to transfer"),
        demandOption: true,
        type: "number",
      },
      token: {
        describe: chalk.cyan("Token address"),
        demandOption: true,
        type: "string",
      },
      mode: {
        describe: chalk.cyan("Paymaster mode"),
        demandOption: false,
        type: "string",
      },
    },
    (argv) => {
      const amount = argv.amount;
      const tokenAddress = argv.token;
      const recipientAddress = argv.to;
      console.log(
        chalk.magenta(
          `Transferring ${amount} tokens of ${tokenAddress} to ${recipientAddress}...`
        )
      );
      if(argv.mode === "TOKEN") {
        erc20TransferPayERC20(
          recipientAddress,
          amount,
          tokenAddress
        );
      }
      else {
        erc20Transfer(
          recipientAddress,
          amount,
          tokenAddress
        );
      }
    }
  )
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
      if(argv.mode === "TOKEN") {
        mintNftPayERC20();
      }
      else if(argv.mode === "HYBRID") {
        mintNftTrySponsorshipOtherwisePayERC20();
      } else if (argv.mode === "TOKEN_PARALLEL_USER_OPS") {
        parallelUserOpsMintNFTPayERC20();
      } else if (argv.mode === "PARALLEL_USER_OPS") {
        parallelUserOpsMintNft()
      }
      else {
        mintNft();
      }
    }
  )
  .command(
    "multiChainMint",
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
      if(argv.mode === "TOKEN") {
        mintNftPayERC20();
      }
      else if(argv.mode === "HYBRID") {
        mintNftTrySponsorshipOtherwisePayERC20();
      }
      else {
        multiChainMint();
      }
    }
  )
  // Batch mint nft token to SmartAccount
  .command(
    "batchMint",
    chalk.blue("Batch mint nft 2 times"),
    {
      mode: {
        describe: chalk.cyan("Paymaster mode"),
        demandOption: false,
        type: "string",
      },
    },
    (argv) => {
      console.log(
        chalk.magenta("Batch minting 2 NFT tokens to the SmartAccount...")
      );
      if(argv.mode === "TOKEN") {
        batchMintNftPayERC20();
      }
      else if(argv.mode === "HYBRID") {
        batchMintNftTrySponsorshipOtherwisePayERC20();
      }
      else {
        batchMintNft();
      }
    }
  )
  .help().argv;
