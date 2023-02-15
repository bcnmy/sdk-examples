import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import createSelectors from "./selectors";

import { ethers } from "ethers";
import SmartAccount from "@biconomy/smart-account";
import SocialLogin from "@biconomy/web3-auth";
import { ChainId } from "@biconomy/core-types";

interface BiconomyState {
  provider: ethers.providers.Web3Provider | null;
  account: string | null;
  smartAccountAddress: string | null;
  signer: ethers.Signer | null;
  smartAccountLoading: boolean;
}

type BiconomyActions = {
  setProviderAndAccount: (sdk: SocialLogin) => void;
  setSmartAccount: (chainId: ChainId) => void;
  reset: () => void;
};

// define the initial state
const initialState: BiconomyState = {
  provider: null,
  account: null,
  smartAccountAddress: null,
  signer: null,
  smartAccountLoading: false,
};

const useBiconomyStore = create<BiconomyState & BiconomyActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      setProviderAndAccount: async (sdk) => {
        try {
          set({ smartAccountLoading: true });
          const sdkProvider = sdk?.provider;
          const { provider: existingProvider } = get();
          // if get provider means user is logged in to biconomy, also check if provider is not already set to avoid rerender
          if (sdkProvider && !existingProvider) {
            const provider = new ethers.providers.Web3Provider(sdkProvider);
            const accounts = await provider.listAccounts();
            console.log("accounts", accounts, "provider", provider);
            set({ provider, account: accounts[0] });
          }
        } catch (error) {
          throw error;
        } finally {
          // set({ provider });
          set({ smartAccountLoading: false });
        }
      },
      setSmartAccount: async (chainId) => {
        set({ smartAccountLoading: true });
        try {
          const { provider, account, signer: existingSigner } = get();
          if (!provider || !account)
            throw new Error("Provider or account not set");
          // if signer is already set, means user is already logged in to smart account, so no need to set again
          if (existingSigner) return;
          const smartAccountSdk = new SmartAccount(provider, {
            activeNetworkId: chainId,
            supportedNetworksIds: [chainId],
          });
          await smartAccountSdk.init();
          const context = smartAccountSdk.getSmartAccountContext();
          const smartAccountAddress = context.baseWallet.getAddress();
          const signer = smartAccountSdk.getsigner();
          set({ smartAccountAddress, signer });
          console.log(
            "smartAccountAddress",
            smartAccountAddress,
            "signer",
            signer
          );
        } catch (error) {
          throw error;
        } finally {
          set({ smartAccountLoading: false });
        }
      },
      reset: () => {
        set(initialState);
      },
    }),
    {
      name: "biconomy-storage", // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => sessionStorage), // see here if need to use IndexedDB or Ionic Storage https://docs.pmnd.rs/zustand/integrations/persisting-store-data#how-can-i-use-a-custom-storage-engine?
      onRehydrateStorage: (state) => {
        console.log("hydration starts");
        // optional
        return (state, error) => {
          if (error) {
            console.log("an error happened during hydration", error);
          } else {
            console.log("hydration finished");
          }
        };
      },
    }
  )
);

export default createSelectors(useBiconomyStore);
