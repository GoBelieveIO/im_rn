
import {
  AppRegistry
} from 'react-native';

import App from './App';
import PeerChat from "./page/PeerChat";
import Navigator from "./Navigation";
import {ENABLE_NATIVE_NAVIGATOR} from "./config";


if (ENABLE_NATIVE_NAVIGATOR) {
  Navigator.registerComponent('app', () => App);
  Navigator.registerComponent('PeerChat', () => PeerChat);
} else {
  AppRegistry.registerComponent('app', () => App);
}