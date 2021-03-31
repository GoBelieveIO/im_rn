import { NativeModules, NativeEventEmitter } from 'react-native';
import React, { useEffect, useRef } from 'react';
import {AppRegistry} from 'react-native';

const { NavigatorModule } = NativeModules;

function processButton(button) {
    button = Object.assign({}, button);
    if (button.title && typeof(button.title) == "function") {
        button.title = button.title();
    }
    return button;
}

var uniqueId = 1000;

class Navigator {
    constructor(navigatorId, screenInstanceId) {
        this.navigatorId = navigatorId;
        this.screenInstanceId = screenInstanceId;
    }

    push(screenId, passProps) {
        if ("id" in passProps || "navigator" in passProps || 
            "navigatorId" in passProps || "screenInstanceId" in passProps) {
            throw "props can't include id|navigator|navigatorId|screenInstanceId property";
        }

        var id = ++uniqueId;
        var props = {id:id};
        for (let k in passProps) {
            let v = passProps[k];
            if (typeof(v) == "string" || typeof(v) == "number" || typeof(v) == "boolean") {
                props[k] = v;
            }
        }

        Navigation.screenProps[id] = {component:screenId, passProps:passProps};
        NavigatorModule.push(this.navigatorId, screenId, props);
    }
    
    pop() {
        NavigatorModule.pop();
    }
    
    setTitle(title)  {
        NavigatorModule.setTitle(this.screenInstanceId, title);
    }
}

export function Title(props) {
    useEffect(() => {
        Navigator.setTitle(props.screenInstanceId, props.title);
    }, [props.title]);
    return null;
}

var Navigation = {
    screenProps:{},
    screens:{},
    eventEmitter:new NativeEventEmitter(NavigatorModule),

    registerComponent: function(screenId, getComponentFunc) {
        var NavigatorApp = function(props) {
            const internalRef = useRef(null);

            var screen = {};
            if (props.id in Navigation.screenProps) {
                //delete 为了避免内存泄漏
                screen = Navigation.screenProps[props.id];
                delete(Navigation.screenProps[props.id]);
            } else if (props.id) {
                console.warn("can't get screen props, screen id:", screenId, " instance id:", props.id);
            }

            useEffect(() => {
                console.log("register screen:", props.screenInstanceId);
                Navigation.screens[props.screenInstanceId] = internalRef.current;
                return () => {
                    console.log("delete screen:", props.screenInstanceId);
                    delete(Navigation.screens[props.screenInstanceId]);
                }
            }, []);
        
            var navigator = new Navigator(props.navigatorId, props.screenInstanceId);

            var passProps = screen.passProps;
            var screenProps = {...props, ...passProps};
            delete(screenProps.id);
            delete(screenProps.navigatorId);
            delete(screenProps.screenInstanceId);

            const InternalComponent = getComponentFunc();
       
            var passProps = screen.passProps;
            return (<InternalComponent ref={internalRef} navigator={navigator} {...screenProps}></InternalComponent>);
        }

        const InternalComponent = getComponentFunc();
        if (InternalComponent.navigatorButtons) {
            let navigatorButtons = Object.assign({}, InternalComponent.navigatorButtons);
            if (navigatorButtons.leftButtons) {
                navigatorButtons.leftButtons = navigatorButtons.leftButtons.map((button) => {
                    return processButton(button);
                });
            }
            if(navigatorButtons.rightButtons) {
                navigatorButtons.rightButtons = navigatorButtons.rightButtons.map((button) => {
                    return processButton(button);
                });
            }
            this.registerNavigatorButtons(screenId, navigatorButtons);
        }
        AppRegistry.registerComponent(screenId, () => NavigatorApp);
    },

    registerNavigatorButtons: function(screenId, navigatorButtons) {
        NavigatorModule.registerNavigatorButtons(screenId, navigatorButtons);
    },
}


Navigation.eventEmitter.addListener('NavBarButtonPress', (event) => {
    var screenInstanceId = event.screenInstanceId;
    if (screenInstanceId in Navigation.screens) {
        let screenRef = Navigation.screens[screenInstanceId];
        if ("onNavigatorEvent" in screenRef) {
            screenRef.onNavigatorEvent(event);
        }
    }
});

export default Navigation;