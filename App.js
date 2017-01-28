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
    AsyncStorage
} from 'react-native';

import { NativeModules, NativeAppEventEmitter } from 'react-native';

import Login from "./login";
import PeerChat from "./PeerChat";
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import PeerMessageDB from './PeerMessageDB.js';
import RCTDeviceEventEmitter from 'RCTDeviceEventEmitter'

import {setConversation, setMessages, addMessage, ackMessage} from './actions'

var SQLite = require('react-native-sqlite-storage');
SQLite.enablePromise(false);

var appReducers = require('./reducers');
var IMService = require("./im");
var im = IMService.instance;

import {Navigation} from 'react-native-navigation';


var app = {
    registerScreens: function() {
        Navigation.registerComponent('demo.Login', () => Login, this.store, Provider);
        Navigation.registerComponent('demo.PeerChat', () => PeerChat, this.store, Provider);
    },
    
    handlePeerMessage: function(message) {
        console.log("handle peer message:", message, msgObj);
        message.flags = 0;
        
        var msgObj = JSON.parse(message.content);

        if (msgObj.text) {
            message.text = msgObj.text;
        } else if (msgObj.image2) {
            message.image = msgObj.image2
        } else if (msgObj.audio) {
            message.audio = msgObj.audio;
        } else if (msgObj.location) {
            message.location = msgObj.location;
        }
        message.uuid = msgObj.uuid;
        
        var t = new Date();
        t.setTime(message.timestamp*1000);
        message.createdAt = t;
        message.user = {
            _id: message.sender
        }
        
        var self = this;

        var cid = (this.uid == message.sender) ? message.receiver : message.sender;
        var db = PeerMessageDB.getInstance();
        db.insertMessage(message, cid,
                         function(rowid) {
                             message.id = rowid;
                             message._id = rowid;
                             RCTDeviceEventEmitter.emit('peer_message', message);
                         },
                         function(err) {
                             
                         });
        
    },

    handleMessageACK: function(msgID, uid) {
        console.log("handle message ack");
        var conv = this.store.getState().conversation;
        if (!conv) {
            return;
        }
        var cid = conv.cid;
        if (uid != cid) {
            return;
        }

        this.store.dispatch(ackMessage(msgID));
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
        this.store = createStore(appReducers);
    
        

        var db = SQLite.openDatabase({name:"gobelieve.db", createFromLocation : 1},
                                     function() {
                                         console.log("db open success");
                                     },
                                     function(err) {
                                         console.log("db open error:", err);
                                     });
        PeerMessageDB.getInstance().setDB(db);

        this.db = db;
        

        
   
        
        AppState.addEventListener('change', this.handleAppStateChange.bind(this));
        var im = IMService.instance;
        im.startReachabilityNotifier();
        im.addObserver(this);

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
