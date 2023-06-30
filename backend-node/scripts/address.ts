const chalk = require("chalk");
const { createBiconomyAccountInstance } = require("./helperFunctions");

export async function getAddress() {
  const biconomySmartAccount = await createBiconomyAccountInstance();
  console.log(
    chalk.green(`SmartAccount address: ${biconomySmartAccount.address}`)
  );
}
