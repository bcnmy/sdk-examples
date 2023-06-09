const chalk = require('chalk');
const { createBiconomyAccountInstance } = require('./createInstance')

async function getAddress() {
  const biconomySmartAccount = await createBiconomyAccountInstance()
  console.log(chalk.green(`SmartAccount address: ${biconomySmartAccount.address}`));
}

module.exports = { getAddress };