import chalk from "chalk";
import { createBiconomyAccountInstance } from "./helperFunctions";
import config from "../config.json";

export async function getAddress() {
  const biconomySmartAccount = await createBiconomyAccountInstance();
  const scwAddress = await biconomySmartAccount.getAccountAddress();
  console.log(chalk.green(`SmartAccount address: ${scwAddress}`));
}
