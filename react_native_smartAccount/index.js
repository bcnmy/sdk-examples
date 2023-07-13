/**
 * @format
 */

import {AppRegistry} from 'react-native';
import './shim.js'
// Import the crypto getRandomValues shim (**BEFORE** the shims)
import 'react-native-get-random-values';
// Import the the ethers shims (**BEFORE** ethers)
import '@ethersproject/shims';
// Import the ethers library
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
