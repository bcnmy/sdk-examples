import chalk from "chalk";
import { createBiconomyAccountInstance } from "./helperFunctions";

export async function getAddress() {
  const biconomySmartAccount = await createBiconomyAccountInstance();
  const scwAddress = await biconomySmartAccount.getSmartAccountAddress();
  console.log(chalk.green(`SmartAccount address: ${scwAddress}`));
}
