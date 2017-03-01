/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
    AppRegistry,
    StyleSheet,
    Text,
    TextInput,
    Image,
    ScrollView,
    Navigator,
    TouchableHighlight,
    ActionSheetIOS,
    NetInfo,
    AppState,
    View,
    AsyncStorage,
    NativeModules,
    NativeAppEventEmitter,
} from 'react-native';
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import RCTDeviceEventEmitter from 'RCTDeviceEventEmitter'
import {Navigation} from 'react-native-navigation';
var SQLite = require('react-native-sqlite-storage');
SQLite.enablePromise(false);

import PeerMessageDB from './chat/PeerMessageDB';
import GroupMessageDB from './chat/GroupMessageDB';
import {setMessages, addMessage, ackMessage} from './chat/actions'
import {addConversation, updateConversation} from "./actions";
import {setConversation} from './actions';

import Login from "./Login";
import Conversation from './Conversation';
import PeerChat from "./PeerChat";
import GroupChat from "./GroupChat"
import Photo from './chat/Photo';
import LocationPicker from './chat/LocationPicker';

import {conversationsReducer, conversationReducer} from './reducers';
import {messagesReducer}  from './chat/reducers';
var IMService = require("./chat/im");
var im = IMService.instance;

//do not use combineReducers ignore init state of createStore
function appReducer(state={}, action) {
    return {
        conversations:conversationsReducer(state.conversations, action),
        messages:messagesReducer(state.messages, action),
        conversation:conversationReducer(state.conversation, action),
    };
}

var app = {
    registerScreens: function() {
        Navigation.registerComponent('demo.Login', () => Login, this.store, Provider);
        Navigation.registerComponent('demo.Conversation', () => Conversation, this.store, Provider);
        
        Navigation.registerComponent('chat.PeerChat', () => PeerChat, this.store, Provider);
        Navigation.registerComponent('chat.GroupChat', () => GroupChat, this.store, Provider);
        Navigation.registerComponent('chat.Photo', () => Photo, this.store, Provider);
        Navigation.registerComponent('chat.LocationPicker', () => LocationPicker, this.store, Provider);
    },
    

    handleConnectivityChange: function(reach) {
        console.log('connectivity change: ' + reach);
    },

    handleAppStateChange: function(currentAppState) {
        console.log("app state:", currentAppState);
        if (currentAppState == "background") {
            im.enterBackground();
        } else if (currentAppState == "active") {
            im.enterForeground();
        }
    },

    startApp: function() {
        this.store = createStore(appReducer);
        
        var db = SQLite.openDatabase({name:"gobelieve.db", createFromLocation : 1},
                                     function() {
                                         console.log("db open success");
                                     },
                                     function(err) {
                                         console.log("db open error:", err);
                                     });
        PeerMessageDB.getInstance().setDB(db);
        GroupMessageDB.getInstance().setDB(db);

        this.db = db;
        
        AppState.addEventListener('change', this.handleAppStateChange.bind(this));
        var im = IMService.instance;
        im.startReachabilityNotifier();

        this.registerScreens();
        Navigation.startSingleScreenApp({
            screen: {
                screen: 'demo.Login',
                title: 'Login',
                navigatorStyle: {
                    navBarBackgroundColor: '#4dbce9',
                    navBarTextColor: '#ffff00',
                    navBarSubtitleTextColor: '#ff0000',
                    navBarButtonColor: '#ffffff',
                    statusBarTextColorScheme: 'light'
                },
            },
            passProps: {
                app:this
            }
        });
    },
}

app.startApp();
