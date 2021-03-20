/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import { useEffect, useState } from 'react';
import {
    AppState,
    Text,
    Button
} from 'react-native';

import EventEmitter from 'eventemitter3';
var SQLite = require('react-native-sqlite-storage');
SQLite.enablePromise(false);

import PeerMessageDB from './chat/PeerMessageDB';
import GroupMessageDB from './chat/GroupMessageDB';

import Login from "./Login";

import Conversation from './Conversation';
// import Search from './Search';

//import PeerChat from "./PeerChat";
// import GroupChat from "./GroupChat"
// import Photo from './chat/Photo';
// import LocationPicker from './chat/LocationPicker';

import { NativeRouter, Route, Switch, Link, useHistory } from "react-router-native";


var IMService = require("./chat/im");
var im = IMService.instance;


function NavigationBar() {
    let history = useHistory();

    const [count, setCount] = useState(1);
    function onLocationUpdate(location, action) {
        console.log("history len:", history.length);
        console.log("on location update:", location, action);
        if (action == "POP") {
            setCount(history.length - 1);
        } else {
            setCount(history.length);
        }
    }

    function onPress() {
        history.goBack();
    }

    useEffect(() => {
        history.listen(onLocationUpdate);
    }, []);

    if (count > 1){
        return (<Button onPress = {onPress}
            title = "Back"
            color = "#841584"/>);
    } else {
        return null;
    }

}

export default class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
  
        };
        console.log("this props:", this.props);
        this.emitter = new EventEmitter();
        this.handleConnectivityChange = this.handleConnectivityChange.bind(this);
        this.handleAppStateChange = this.handleAppStateChange.bind(this);
    }
    
    componentDidMount() {

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
        
        AppState.addEventListener('change', this.handleAppStateChange);
        //this.startReachabilityNotifier();
    }

    componentWillUnmount() {

    }

    startReachabilityNotifier() {
        NetInfo.fetch().done((reach) => {
            if (reach && (reach.toLowerCase() == 'wifi' || reach.toLowerCase() == 'cell')) {
                im.reachable = true;
            } else {
                im.reachable = false;
            }
            console.log("reachable:", reach, im.reachable);
        });

        //never remove listener
        NetInfo.addEventListener(
            'change',
            this.handleConnectivityChange
        );
    }
    
    handleConnectivityChange(reach) {
        console.log('connectivity change: ' + reach);
        im.handleConnectivityChange(reach);
    }

    handleAppStateChange(currentAppState) {
        console.log("app state:", currentAppState);
        if (currentAppState == "background") {
            im.enterBackground();
        } else if (currentAppState == "active") {
            im.enterForeground();
        }
    }

    render() {
        return (
            <NativeRouter   
                initialEntries={["/"]}
                initialIndex={0}>
                <NavigationBar></NavigationBar>
                <Switch>
                    <Route exact path="/" component={Login} />
                    <Route path="/conversations" render={(routeProps) => {
                        console.log("route props:", routeProps, routeProps.location.state);
                        return (<Conversation 
                                    emitter={this.emitter}
                                    testPeer={routeProps.location.state.testPeer} 
                                    uid={routeProps.location.state.uid}
                                    token={routeProps.location.state.token}
                                    ></Conversation>);
                    }}>
                    </Route>
                </Switch>
            </NativeRouter>
        );
    }

}
