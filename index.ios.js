
import {
  AppRegistry,
  Text
} from 'react-native';
import React from "react";

import App from './App';
import PeerChat from "./chat/PeerChat";

AppRegistry.registerComponent('app', () => App);
AppRegistry.registerComponent('PeerChat', () => PeerChat);