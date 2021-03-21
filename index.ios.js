
import {
  AppRegistry
} from 'react-native';

import App from './App';
import PeerChat from "./page/PeerChat";
import {NavigatorApp} from "./Navigation";

AppRegistry.registerComponent('app', () => App);
AppRegistry.registerComponent('NavigatorApp', () => NavigatorApp);
AppRegistry.registerComponent('PeerChat', () => PeerChat);