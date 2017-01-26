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
import PeerChat from "./peer_chat";
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import PeerMessageDB from './PeerMessageDB.js';

import {setConversation, setMessages, addMessage, ackMessage} from './actions'

var SQLite = require('react-native-sqlite-storage');
SQLite.enablePromise(false);

var appReducers = require('./reducers');
var IMService = require("./im");
var im = IMService.instance;


export default class App extends Component {
    constructor(props) {
        super(props);
        this.handleConnectivityChange = this.handleConnectivityChange.bind(this);
        this.handleAppStateChange = this.handleAppStateChange.bind(this);


        this.store = createStore(appReducers);

        var self = this;
        AsyncStorage.getItem("access_token", function(err, value) {
            if (err) {
                console.log("get access token err:", err);
                self.setState({loading:false});
            } else if (value) {
                console.log("access token:", value);
                im.accessToken = value;
                im.start();
                self.token = value;
                self.db = SQLite.openDatabase({name:"gobelieve.db", createFromLocation : 1},
                                              function() {
                                                  console.log("db open success");
                                              },
                                              function(err) {
                                                  console.log("db open error:", err);
                                              });
                PeerMessageDB.getInstance().setDB(self.db);
                
                self.setState({loading:false, access_token:value});

                var conv = {
                    cid: 2,
                    unread: 0
                };
                
                self.store.dispatch(setConversation(conv));
            } else {
                self.setState({loading:false});                
            }
        });
        this.state = {
            loading:true,
            access_token:""
        };

    }
    
    componentDidMount() {
        AppState.addEventListener('change', this.handleAppStateChange);
        var im = IMService.instance;
        im.startReachabilityNotifier();
        im.addObserver(this);
    }

    componentWillUnmount() {
        AppState.removeEventListener('change', this.handleAppStateChange);
        
        var im = IMService.instance;
        im.removeObserver(this);
    }

    handlePeerMessage(message) {
        var conv = this.store.getState().conversation;
        if (!conv) {
            return;
        }
        var cid = conv.cid;
        if (message.sender != cid && 
            message.receiver != cid) {
            return;
        }

        message.flags = 0;
        var msgObj = JSON.parse(message.content);
        console.log("handle peer message:", message, msgObj);
        
        var self = this;
        var db = PeerMessageDB.getInstance();
        db.insertMessage(message, cid,
                         function(rowid) {
                             message.id = rowid;
                             message._id = rowid;
                             if (msgObj.text) {
                                 message.text = msgObj.text;
                             } else if (msgObj.image2) {
                                 message.image = msgObj.image2
                             } else if (msgObj.audio) {
                                 message.audio = msgObj.auido;
                             } else if (msgObj.location) {
                                 message.location = msgObj.location;
                             }

                             var t = new Date();
                             t.setTime(message.timestamp*1000);
                             message.createdAt = t;
                             message.user = {
                                 _id: message.sender
                             }

                             self.store.dispatch(addMessage(message));                                                      
                         },
                         function(err) {
                                                      
                         });
    
    }

    handleMessageACK(msgID, uid) {
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
    }


    handleConnectivityChange(reach) {
        console.log('connectivity change: ' + reach);
    }

    handleAppStateChange(currentAppState) {
        console.log("app state:", currentAppState);
        if (currentAppState == "background") {
            im.enterBackground();
        } else if (currentAppState == "active") {
            im.enterForeground();
        }
    }

    renderLoading() {
        return (
            <View>
                
            </View>
        )
        
    }
    renderNavigator() {
        const routes = [
            {index: "login"},
            {index: "chat", sender:1, receiver:2}
        ];

        var initialRoute = routes[0];
        if (this.state.access_token) {
            initialRoute = routes[1];
        }
        var self = this;
        var renderScene = function(route, navigator) {
            if (route.index == "login") {
                return <Login navigator={navigator}/>
            } else if (route.index == "chat") {
                console.log("render chat");
                return <PeerChat navigator={navigator}
                                 sender={route.sender}
                                 receiver={route.receiver}
                                 token={self.token} />
            } else {
                console.log("eeeeeeeeeeeeee");
            }
        }

        return (
            <Provider store={this.store}>
                <Navigator ref={(nav) => { this.navigator = nav; }} 
                           initialRoute={initialRoute}
                           renderScene={renderScene}
                           configureScene={(route, routeStack) =>
                               Navigator.SceneConfigs.FloatFromRight}
                           navigationBar={
                               <Navigator.NavigationBar
                             routeMapper={{
                                 LeftButton: (route, navigator, index, navState) =>
                                     {
                                         if (route.index === "login") {
                                             return null;
                                         } else {
                                             return (
                                                 <TouchableHighlight onPress={() => navigator.pop()}>
                                                     <Text>Back</Text>
                                                 </TouchableHighlight>
                                             );
                                         }
                                     },
                                 RightButton: (route, navigator, index, navState) =>
                                     { return (<Text>Done</Text>); },
                                 Title: (route, navigator, index, navState) =>
                                     { return (<Text>Awesome Nav Bar</Text>); },
                             }}
                             style={{backgroundColor: 'gray'}}/>
                               
                                         }/>
            </Provider>
        );
    }

    render() {
        if (this.state.loading) {
            return this.renderLoading();
        } else {
            return this.renderNavigator();
        }
    }

}


