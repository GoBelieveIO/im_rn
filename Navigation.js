import { Text, View, NativeModules } from 'react-native';
import React from 'react';
import PeerChat from "./page/PeerChat";

const { NavigatorModule } = NativeModules;

var uniqueId = 0;
var Navigator = {
    screens:{},

    push: function(screen, passProps) {
        var id = ++uniqueId;
        this.screens[id] = {component:screen, passProps:passProps};
        NavigatorModule.push("NavigatorApp", {id:id});
    },
    
    pop: function () {
        NavigatorModule.pop();
    },
    
    setTitle: function(title)  {
    
    },
}
export function NavigatorApp2(props) {
    return <Text>test</Text>;
}

export function NavigatorApp(props) {
    console.log("props:", props);
    var id = props.id;
    if (!(id in Navigator.screens)) {
        console.log("invalid id:", id);
        return (<Text>{"invalid id:" + id}</Text>);
    }

    var screen = Navigator.screens[id];
    delete(Navigator.screens[id]);
    
    var passProps = screen.passProps;
    var component = screen.component;

    console.log("pass props:", passProps);

    if (typeof(component) == "function") {
        var ScreenComponent = component;
        return <ScreenComponent {...passProps}></ScreenComponent>;
    }
    else if (component == "PeerChat") {
        var passProps = screen.passProps;
        return (<PeerChat {...passProps}></PeerChat>);
    } else {
        return null;
    }
}

export default Navigator;