import * as chains from "viem/chains"
import type { Chain } from "viem/chains"
export const getChain = (chainId: number): Chain => {
  for (const chain of Object.values(chains)) {
    if (chain.id === chainId) {
      return chain
    }
  }
  throw new Error("Chain not found")
}
