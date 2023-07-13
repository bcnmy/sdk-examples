/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import React from 'react';
import {ethers} from 'ethers';
import SmartAccount from '@biconomy/smart-account';
import type {PropsWithChildren} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Button,
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

type SectionProps = PropsWithChildren<{
  title: string;
}>;

function Section({children, title}: SectionProps): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
}

function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const ethersGetEOA = async () => {
    const rpcProvider = new ethers.providers.JsonRpcProvider(
      'https://rpc.ankr.com/eth_goerli',
    );
    const signer = new ethers.Wallet(
      '88183b1ba04fb194405424e74710084648e269588d319d72fc373d20f468c147',
      rpcProvider,
    );
    const eoa = await signer.getAddress();
    console.log('eoa', eoa);
    // EOA - 0x0000766ea6A73EB2Ea64C4271dCF240cB0F4Ae39
    // SCW - 0xfc8daf3337dfaf19b3c73bec7efa68e66320ad18
  };

  const createSmartAccount = async () => {
    try {
      const rpcProvider = new ethers.providers.JsonRpcProvider(
        'https://rpc.ankr.com/eth_goerli',
      );
      const signer = new ethers.Wallet(
        '88183b1ba04fb194405424e74710084648e269588d319d72fc373d20f468c147',
        rpcProvider,
      );
      console.log('signer', signer);
      const wallet = new SmartAccount(signer, {
        activeNetworkId: 5,
        supportedNetworksIds: [5],
      });
      const smartAccount = await wallet.init();
      console.log(`SmartAccount address: ${smartAccount.address}`);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <Header />
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
          <Button title="Create EOA" onPress={ethersGetEOA} />
          <Button title="Create Smart Account" onPress={createSmartAccount} />
          <Section title="Step One">
            Edit <Text style={styles.highlight}>App.tsx</Text> to change this
            screen and then come back to see your edits.
          </Section>
          <Section title="See Your Changes">
            <ReloadInstructions />
          </Section>
          <Section title="Debug">
            <DebugInstructions />
          </Section>
          <Section title="Learn More">
            Read the docs to discover what to do next:
          </Section>
          <LearnMoreLinks />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
