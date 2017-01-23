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

var IMService = require("./im");
var im = IMService.instance;


export default class App extends Component {
    constructor(props) {
        super(props);
        this.handleConnectivityChange = this.handleConnectivityChange.bind(this);
        this.handleAppStateChange = this.handleAppStateChange.bind(this);

        var self = this;
        AsyncStorage.getItem("access_token", function(err, value) {
            if (err) {
                console.log("get access token err:", err);
            } else if (value) {
                console.log("access token:", value);
                im.accessToken = value;
                im.start();
                self.setState({loading:false, access_token:value});
            }
        });

        this.state = {
            loading:true,
            access_token:""
        };

    }
    
    componentDidMount() {
        AppState.addEventListener('change', this.handleAppStateChange);
        im.startReachabilityNotifier();
    }

    componentWillUnmount() {
        AppState.removeEventListener('change', this.handleAppStateChange);
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
            {index: "chat"}
        ];

        var initialRoute = routes[0];
        if (this.state.access_token) {
            initialRoute = routes[1];
        }
        var renderScene = function(route, navigator) {
            if (route.index == "login") {
                return <Login navigator={navigator}/>
            } else if (route.index == "chat") {
                console.log("render chat");
                return <PeerChat navigator={navigator} sender={route.sender} receiver={route.receiver}/>
            } else {
                console.log("eeeeeeeeeeeeee");
            }
        }

        return (
            <Navigator ref={(nav) => { this.navigator = nav; }} 
                       initialRoute={initialRoute}
                       renderScene={renderScene}
                       configureScene={(route, routeStack) =>
                           Navigator.SceneConfigs.FloatFromRight}/>
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


