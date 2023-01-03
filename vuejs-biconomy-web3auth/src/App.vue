<script setup lang="ts">
import { onMounted } from "vue";
import { ethers } from "ethers";
import SocialLogin from "@biconomy/web3-auth";
import "@biconomy/web3-auth/dist/src/style.css";
import HelloWorld from "./components/HelloWorld.vue";

let socialLoginSDK: SocialLogin;
let address: string = "";
const connectWallet = async () => {
  if (address) return;
  address = "";
  if (socialLoginSDK?.provider) {
    console.info("socialLoginSDK.provider", socialLoginSDK.provider);
    const web3Provider = new ethers.providers.Web3Provider(
      socialLoginSDK.provider
    );
    const signer = web3Provider.getSigner();
    const gotAccount = await signer.getAddress();
    address = gotAccount;
    console.log(address);
    return;
  }
  socialLoginSDK = new SocialLogin();
  await socialLoginSDK.init();
  socialLoginSDK.showWallet();
};

onMounted(() => {
  const interval = setInterval(async () => {
    if (address) {
      clearInterval(interval);
    }
    if (socialLoginSDK?.provider && !address) {
      connectWallet();
    }
  }, 1000);
});

const disconnectWallet = async () => {
  console.log("disconnectWallet");
  address = "";
  socialLoginSDK.logout();
};
</script>

<template>
  <header>
    <img
      alt="Vue logo"
      class="logo"
      src="./assets/logo.svg"
      width="125"
      height="125"
    />

    <div class="wrapper">
      <HelloWorld msg="You did it!" />
    </div>
  </header>

  <main>
    <button v-if="address" @click="disconnectWallet">
      Disconnect Wallet {{ address }}
    </button>

    <button v-else @click="connectWallet">Connect Wallet</button>
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
