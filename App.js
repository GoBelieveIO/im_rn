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
import {addConversation, updateConversation} from "./chat/actions";
import {setConversation} from './chat/actions';

import Login from "./Login";
import Conversation from './Conversation';
import PeerChat from "./chat/PeerChat";
import GroupChat from "./chat/GroupChat"
import Photo from './chat/Photo';

var appReducers = require('./chat/reducers');
var IMService = require("./chat/im");
var im = IMService.instance;

var app = {
    registerScreens: function() {
        Navigation.registerComponent('demo.Login', () => Login, this.store, Provider);
        Navigation.registerComponent('demo.PeerChat', () => PeerChat, this.store, Provider);
        Navigation.registerComponent('demo.GroupChat', () => GroupChat, this.store, Provider);
        Navigation.registerComponent('demo.Conversation', () => Conversation, this.store, Provider);
        Navigation.registerComponent('demo.Photo', () => Photo, this.store, Provider);
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


        cid = "p_" + cid;
        var state = this.store.getState();
        console.log("state conversations:", state.conversations);
        var index = -1;        
        for (var i in state.conversations) {
            var conv = state.conversations[i];
            if (conv.cid == cid) {
                index = i;
                break;
            }
        }

        var conv;
        if (index != -1) {
            var c = state.conversations[index];
            var newConv = Object.assign({}, c);
            if (cid == message.sender) {
                newConv.unread = conv.unread + 1;
            }
            conv = newConv;
        } else {
            conv = {
                id:cid,
                cid:cid,
                name:cid,
                unread:0,
            };
            if (cid == message.sender) {
                conv.unread = 1;
            }
        }

        conv.message = message;
        conv.timestamp = message.timestamp;
        if (msgObj.text) {
            conv.content = msgObj.text;
        } else if (msgObj.image2) {
            conv.content = "一张图片";
        } else if (msgObj.audio) {
            conv.content = "语音"
        } else if (msgObj.location) {
            conv.content = "位置";
        } else {
            conv.content = "";
        }
        
        console.log("new conv:", newConv);
        this.store.dispatch(updateConversation(conv, index));
    },

    handleMessageACK: function(msg) {
        console.log("handle message ack");
        var conv = this.store.getState().conversation;
        if (!conv) {
            return;
        }
        var cid = conv.cid;
        if ("p_" + msg.receiver != cid) {
            return;
        }

        this.store.dispatch(ackMessage(msg.id));
    },


    handleGroupMessage: function(message) {
        console.log("handle group message:", message, msgObj);
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
        
  
        var db = GroupMessageDB.getInstance();
        db.insertMessage(message,
                         function(rowid) {
                             message.id = rowid;
                             message._id = rowid;
                             RCTDeviceEventEmitter.emit('group_message', message);
                         },
                         function(err) {
                             
                         });

        var cid =  "g_" + message.receiver;
        var state = this.store.getState();
        console.log("state conversations:", state.conversations);
        var index = -1;        
        for (var i in state.conversations) {
            var conv = state.conversations[i];
            if (conv.cid == cid) {
                index = i;
                break;
            }
        }

        var conv;
        if (index != -1) {
            var c = state.conversations[index];
            var newConv = Object.assign({}, c);
            if (cid == message.sender) {
                newConv.unread = conv.unread + 1;
            }
            conv = newConv;
        } else {
            conv = {
                id:cid,
                cid:cid,
                name:cid,
                unread:0,
            };
            if (cid == message.sender) {
                conv.unread = 1;
            }
        }

        conv.message = message;
        conv.timestamp = message.timestamp;
        if (msgObj.text) {
            conv.content = msgObj.text;
        } else if (msgObj.image2) {
            conv.content = "一张图片";
        } else if (msgObj.audio) {
            conv.content = "语音"
        } else if (msgObj.location) {
            conv.content = "位置";
        } else {
            conv.content = "";
        }
        
        console.log("new conv:", newConv);
        this.store.dispatch(updateConversation(conv, index));
    },

    handleGroupMessageACK: function(msg) {
        console.log("handle group message ack");
        var conv = this.store.getState().conversation;
        if (!conv) {
            return;
        }
        var cid = conv.cid;
        if ("g_" + msg.receiver != cid) {
            return;
        }

        this.store.dispatch(ackMessage(msg.id));
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
        GroupMessageDB.getInstance().setDB(db);

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
