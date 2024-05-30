#!/usr/bin/env node
import * as yargs from "yargs"
const chalk = require("chalk")
import { getAddress } from "./address"
import { batchMintNftPayERC20 } from "./erc20/batchMintNFT"
import { deploySmartContractPayERC20 } from "./erc20/deploy"
import { erc20TransferPayERC20 } from "./erc20/erc20Transfer"
import { mintNftPayERC20 } from "./erc20/mintNFT"
import { nativeTransferPayERC20 } from "./erc20/nativeTransfer"
import { parallelUserOpsMintNFTPayERC20 } from "./erc20/parallelUserOpsMintNFT"
import { batchMintNft } from "./gasless/batchMintNFT"
import { deploySmartContractGasless } from "./gasless/deploy"
import { erc20Transfer } from "./gasless/erc20Transfer"
import { mintNft } from "./gasless/mintNFT"
import { mintNftEthers } from "./gasless/mintNftEthers"
import { multiChainMint } from "./gasless/multiChainMint"
import { nativeTransfer } from "./gasless/nativeTransfer"
import { parallelUserOpsMintNft } from "./gasless/parallelUserOpsMintNFT"
import { batchMintNftTrySponsorshipOtherwisePayERC20 } from "./hybrid-fallback/batchMintNFT"
import { mintNftTrySponsorshipOtherwisePayERC20 } from "./hybrid-fallback/mintNFT"
import { createSession } from "./session/createSession"
import { createSessions } from "./session/createSessions"
import { createTokenPaySession } from "./session/createTokenPaySession"
import { createTokenPaySessions } from "./session/createTokenPaySessions"
import { useSession } from "./session/useSession"
import { useSessions } from "./session/useSessions"
import { useTokenPaySession } from "./session/useTokenPaySession"
import { useTokenPaySessions } from "./session/useTokenPaySessions"

yargs
  .scriptName(chalk.green("smartAccount"))
  .usage("$0 <command> [options]")
  .demandCommand(1, chalk.red.bold("You must specify a command."))
  .recommendCommands()
  // Get SmartAccount address
  .command("address", chalk.blue("Get counterfactual address"), {}, () => {
    getAddress()
  })
  // Transfer native assets (ether/matic)
  .command(
    "transfer",
    chalk.blue("Transfer native (ether/matic)"),
    {
      to: {
        describe: chalk.cyan("Recipient address"),
        demandOption: true,
        type: "string"
      },
      amount: {
        describe: chalk.cyan("Amount of ether to transfer"),
        demandOption: true,
        type: "number"
      },
      mode: {
        describe: chalk.cyan("Paymaster mode"),
        demandOption: false,
        type: "string"
      }
    },
    (argv) => {
      const amount = argv.amount
      const recipientAddress = argv.to
      console.log(
        chalk.magenta(`Transferring ${amount} ether to ${recipientAddress}...`)
      )
      if (argv.mode === "TOKEN") {
        nativeTransferPayERC20(recipientAddress, amount)
      } else {
        nativeTransfer(recipientAddress, amount)
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
        type: "string"
      },
      amount: {
        describe: chalk.cyan("Amount of tokens to transfer"),
        demandOption: true,
        type: "number"
      },
      token: {
        describe: chalk.cyan("Token address"),
        demandOption: true,
        type: "string"
      },
      mode: {
        describe: chalk.cyan("Paymaster mode"),
        demandOption: false,
        type: "string"
      }
    },
    (argv) => {
      const amount = argv.amount
      const tokenAddress = argv.token
      const recipientAddress = argv.to
      console.log(
        chalk.magenta(
          `Transferring ${amount} tokens of ${tokenAddress} to ${recipientAddress}...`
        )
      )
      if (argv.mode === "TOKEN") {
        erc20TransferPayERC20(recipientAddress, amount, tokenAddress)
      } else {
        erc20Transfer(recipientAddress, amount, tokenAddress)
      }
    }
  )
  .command(
    "session",
    chalk.blue("Create or use a session"),
    {
      mode: {
        describe: chalk.cyan("Session mode"),
        demandOption: false,
        type: "string"
      },
      amount: {
        describe: chalk.cyan("Amount of the token to transfer"),
        demandOption: false,
        type: "number"
      },
      batch: {
        describe: chalk.cyan("Batch mode"),
        demandOption: false,
        type: "boolean"
      },
      token: {
        describe: chalk.cyan("Token Payment mode"),
        demandOption: false,
        type: "boolean"
      }
    },
    (argv) => {
      const amount = argv.amount ?? 0.0001
      const batch = argv.batch ?? false
      const token = argv.token ?? false
      const mode = argv.mode ?? "CREATE"
      if (mode === "USE") {
        if (batch) {
          if (token) {
            console.log(chalk.cyan("Use a batch session with token pay"))
            useTokenPaySessions()
          } else {
            console.log(chalk.cyan("Use a batch session with sponsorship"))
            useSessions(amount)
          }
        } else {
          if (token) {
            console.log(chalk.cyan("Use a single session with token pay"))
            useTokenPaySession()
          } else {
            console.log(chalk.cyan("Use a single session with sponsorship"))
            useSession()
          }
        }
      } else {
        if (batch) {
          if (token) {
            console.log(chalk.cyan("Create a batch session with token pay"))
            createTokenPaySessions()
          } else {
            console.log(chalk.cyan("Create a batch session with sponsorship"))
            createSessions(amount)
          }
        } else {
          if (token) {
            console.log(chalk.cyan("Create a single session with token pay"))
            createTokenPaySession()
          } else {
            console.log(chalk.cyan("Create a single session with sponsorship"))
            createSession()
          }
        }
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
        type: "string"
      }
    },
    (argv) => {
      console.log(chalk.magenta("Minting an NFT token to the SmartAccount..."))
      if (argv.mode === "TOKEN") {
        mintNftPayERC20()
      } else if (argv.mode === "ETHERS") {
        mintNftEthers()
      } else if (argv.mode === "HYBRID") {
        mintNftTrySponsorshipOtherwisePayERC20()
      } else if (argv.mode === "TOKEN_PARALLEL_USER_OPS") {
        parallelUserOpsMintNFTPayERC20()
      } else if (argv.mode === "PARALLEL_USER_OPS") {
        parallelUserOpsMintNft()
      } else {
        mintNft()
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
        type: "string"
      }
    },
    (argv) => {
      console.log(chalk.magenta("Minting an NFT token to the SmartAccount..."))
      if (argv.mode === "TOKEN") {
        mintNftPayERC20()
      } else {
        multiChainMint()
      }
    }
  )
  .command(
    "mintNftEthers",
    chalk.blue("Mint nft with ethers signer"),
    {
      mode: {
        describe: chalk.cyan("Paymaster mode"),
        demandOption: false,
        type: "string"
      }
    },
    (argv) => {
      console.log(chalk.magenta("Minting an NFT token to the SmartAccount..."))
      mintNftEthers()
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
        type: "string"
      }
    },
    (argv) => {
      console.log(
        chalk.magenta("Batch minting 2 NFT tokens to the SmartAccount...")
      )
      if (argv.mode === "TOKEN") {
        batchMintNftPayERC20()
      } else if (argv.mode === "HYBRID") {
        batchMintNftTrySponsorshipOtherwisePayERC20()
      } else {
        batchMintNft()
      }
    }
  )
  .command(
    "deploy",
    chalk.blue("Deploy smart account"),
    {
      mode: {
        describe: chalk.cyan("Paymaster mode"),
        demandOption: false,
        type: "string"
      }
    },
    (argv) => {
      console.log(chalk.magenta("Deploying SmartAccount..."))
      if (argv.mode === "TOKEN") {
        deploySmartContractPayERC20()
      } else {
        deploySmartContractGasless()
      }
    }
  )
  .help().argv
