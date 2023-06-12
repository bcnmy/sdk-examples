#!/usr/bin/env node
const yargs = require('yargs');
const chalk = require('chalk');
const { init } = require('./init');
const { getAddress } = require('./address');
const { nativeTransfer } = require('./nativeTransfer');
const { erc20Transfer } = require('./erc20Transfer');
const { mintNft } = require('./mintNft');
const { batchMintNft } = require('./batchMintNft');
const { batchMintNftPayERC20, mintNftPayERC20 } = require('./tokenPaymaster');

yargs
  .scriptName(chalk.green('smartAccount'))
  .usage('$0 <command> [options]')
  .demandCommand(1, chalk.red.bold('You must specify a command.'))
  .recommendCommands()
  // Initialize config file
  .command('init', chalk.blue('Create a config file'), {
    network: {
      describe: chalk.cyan('Choose chain type'),
      demandOption: false,
      type: 'string',
    },
  }, (argv) => {
    const chainType = argv.network;
    console.log(chalk.magenta(`Initializing config for ${chainType} network`));
    init(chainType)
  })
  // Get SmartAccount address
  .command('address', chalk.blue('Get counterfactual address'), {}, () => {
    getAddress();
  })
  // Transfer native assets (ether/matic)
  .command('transfer', chalk.blue('Transfer native (ether/matic)'), {
    to: {
      describe: chalk.cyan('Recipient address'),
      demandOption: true,
      type: 'string',
    },
    amount: {
      describe: chalk.cyan('Amount of ether to transfer'),
      demandOption: true,
      type: 'number',
    },
  }, (argv) => {
    const amount = argv.amount;
    const recipientAddress = argv.to;
    console.log(chalk.magenta(`Transferring ${amount} ether to ${recipientAddress}...`));
    nativeTransfer(recipientAddress, amount);
  })
  // Transfer an ERC20 token
  .command('erc20Transfer', chalk.blue('Transfer an ERC20 token'), {
    to: {
      describe: chalk.cyan('Recipient address'),
      demandOption: true,
      type: 'string',
    },
    amount: {
      describe: chalk.cyan('Amount of tokens to transfer'),
      demandOption: true,
      type: 'number',
    },
    token: {
      describe: chalk.cyan('Token address'),
      demandOption: true,
      type: 'string',
    },
  }, (argv) => {
    const amount = argv.amount;
    const tokenAddress = argv.token;
    const recipientAddress = argv.to;
    console.log(chalk.magenta(`Transferring ${amount} tokens of ${tokenAddress} to ${recipientAddress}...`));
    erc20Transfer(recipientAddress, amount, tokenAddress);
  })
  // Mint nft token to SmartAccount
  .command('mint', chalk.blue('Mint nft token'), {}, () => {
    console.log(chalk.magenta('Minting an NFT token to the SmartAccount...'));
    mintNft();
  })
  // Mint NFT Pay using BTPM
  .command('mintWithBtpm', chalk.blue('Mint nft token'), {}, () => {
    console.log(chalk.magenta('Minting an NFT token to the SmartAccount...'));
    mintNftPayERC20();
  })
  // Mint nft token to SmartAccount
  .command('batchMint', chalk.blue('Batch mint nft 2 times'), {}, () => {
    console.log(chalk.magenta('Batch minting 2 NFT tokens to the SmartAccount...'));
    batchMintNft();
  })
  .help().argv;
