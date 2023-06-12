const chalk = require('chalk');
const { createBiconomyAccountInstance } = require('./helperFunctions')

async function getAddress() {
  const biconomySmartAccount = await createBiconomyAccountInstance()
  console.log(chalk.green(`SmartAccount address: ${biconomySmartAccount.address}`));
}

module.exports = { getAddress };