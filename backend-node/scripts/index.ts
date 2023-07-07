#!/usr/bin/env node
import * as yargs from "yargs";
import chalk from "chalk";
import { init } from "./init.ts";
import { getAddress } from "./address";
import { nativeTransfer } from "./nativeTransfer";
import { erc20Transfer } from "./erc20Transfer";
import { mintNft } from "./mintNft.ts";
import { batchMintNft } from "./batchMintNft";

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
      withTokenPaymaster: {
        describe: chalk.cyan("enable token paymaster payment"),
        demandOption: false,
        type: "boolean",
      },
    },
    (argv) => {
      const amount = argv.amount;
      const recipientAddress = argv.to;
      console.log(
        chalk.magenta(`Transferring ${amount} ether to ${recipientAddress}...`)
      );
      nativeTransfer(
        recipientAddress,
        amount,
        argv.withTokenPaymaster || false
      );
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
      withTokenPaymaster: {
        describe: chalk.cyan("enable token paymaster payment"),
        demandOption: false,
        type: "boolean",
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
      erc20Transfer(
        recipientAddress,
        amount,
        tokenAddress,
        argv.withTokenPaymaster || false
      );
    }
  )
  // Mint nft token to SmartAccount
  .command(
    "mint",
    chalk.blue("Mint nft token"),
    {
      withTokenPaymaster: {
        describe: chalk.cyan("Mint nft token with token paymaster"),
        demandOption: false,
        type: "boolean",
      },
    },
    (argv) => {
      console.log(chalk.magenta("Minting an NFT token to the SmartAccount..."));
      mintNft(argv.withTokenPaymaster || false);
    }
  )
  // Batch mint nft token to SmartAccount
  .command(
    "batchMint",
    chalk.blue("Batch mint nft 2 times"),
    {
      withTokenPaymaster: {
        describe: chalk.cyan("enable token paymaster payment"),
        demandOption: false,
        type: "boolean",
      },
    },
    (argv) => {
      console.log(
        chalk.magenta("Batch minting 2 NFT tokens to the SmartAccount...")
      );
      batchMintNft(argv.withTokenPaymaster || false);
    }
  )
  .help().argv;

// --withSponsorshipPaymaster (// yarn run smartAccount mint --withSponsorshipPaymaster)

// mintNFT = gasless + wallet deployed (index 0 from config)
// mintNFT = gasless + wallet undeployed (get index from config)
// batchMintNft = gasless + wallet deployed (index 0 from config)
// batchMintNft = gasless + wallet undeployed (get index from config)
// setQuote = setQuote gasless + wallet deployed (index 0 from config)
// setQuote = setQuote gasless + walletundeployed (index from config)
// erc20Transfer = gasless + wallet deployed (index 0 from config)
// erc20Transfer = gasless + wallet undeployed (index from config)
// transfer = gasless + wallet deployed (index 0 from config)
// transfer = gasless + wallet undeployed (index from config)
// batchNativeTransfer = gasless + wallet deployed (index 0 from config)
// batchNativeTransfer = gasless + wallet undeployed (index from config)
// batchErc20Transfer = gasless + wallet deployed (index 0 from config)
// batchErc20Transfer = gasless + wallet undeployed (index from config)

// --withSponsorshipPaymaster (// yarn run smartAccount mint --withTokenPaymaster)

// mintNFT = gasless + wallet deployed (index 0 from config)
// mintNFT = gasless + wallet undeployed (get index from config)
// batchMintNft = gasless + wallet deployed (index 0 from config)
// batchMintNft = gasless + wallet undeployed (get index from config)
// setQuote = setQuote gasless + wallet deployed (index 0 from config)
// setQuote = setQuote gasless + walletundeployed (index from config)
// erc20Transfer = gasless + wallet deployed (index 0 from config)
// erc20Transfer = gasless + wallet undeployed (index from config)
// transfer = gasless + wallet deployed (index 0 from config)
// transfer = gasless + wallet undeployed (index from config)
// batchErc20Transfer = gasless + wallet deployed (index 0 from config)
// batchErc20Transfer = gasless + wallet undeployed (index from config)