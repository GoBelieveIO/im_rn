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
    View,
    AsyncStorage
} from 'react-native';

import { NativeModules, NativeAppEventEmitter } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';

var IMService = require("./chat/im");
var im = IMService.instance;

export default class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            sender:"",
            receiver:"",
            visible:false
        };
        console.log("this props:", this.props);
    }
    
    componentDidMount() {
  
    }

    handleLogin() {
        console.log("login:", this.state);
        var sender = parseInt(this.state.sender);
        if (!sender) {
            alert("请填写发送者id");
            return;
        }
        
        var receiver = parseInt(this.state.receiver);
        if (!receiver) {
            alert("请填写接受者者id");
            return;
        }

        this.startIM(sender, receiver);
    }

    startIM(sender, receiver) {
        console.log("start im");
        var self = this;
        var navigator = this.props.navigator;
        var url = "http://demo.gobelieve.io/auth/token";
        var obj = {
            uid:sender,
            user_name:"测试用户",
            platform_id:3,
            device_id:im.device_id,
        };

        this.setState({
            visible:true
        });
        fetch(url, {
            method:"POST",  
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body:JSON.stringify(obj)
        }).then((response) => {
            console.log("status:", response.status);
            this.setState({
                visible:false
            });

            return response.json().then((responseJson)=>{
                if (response.status == 200) {
                    console.log("response json:", responseJson);
                    AsyncStorage.setItem("access_token", responseJson.token);
                    im.accessToken = responseJson.token;
                    console.log("access token:", im.accessToken);
                    im.start();
                    self.props.app.uid = sender;
                
                    navigator.push({
                        title:"对话",
                        screen:"demo.Conversation",
                        passProps:{
                            uid:sender,
                            token:responseJson.token
                        },
                    });
                } else {
                    console.log(responseJson.meta.message);
                }
            });
        }).catch((error) => {
            console.log("error:", error);
            this.setState({
                visible:false
            });
        });
    }



    render() {
        return (
            <View>
                <Spinner visible={this.state.visible} />
                <TextInput
                    onChangeText={(text) => {
                            this.setState({sender:text});
                        }}
                    style={{    
                        marginTop:44,
                        marginLeft:8,
                        marginRight:8,
                        borderWidth: 0.5,
                        borderColor: '#0f0f0f',
                        height:35,
                    }}
                    keyboardType="numeric"
                    placeholder="发送者id"
                    value={this.state.sender}
                />

                <TextInput
                    onChangeText={(text) => {
                            this.setState({receiver:text});
                        }}
                    style={{    
                        marginTop:44,
                        marginLeft:8,
                        marginRight:8,
                        borderWidth: 0.5,
                        borderColor: '#0f0f0f',
                        height:35,
                    }}
                    keyboardType="numeric"
                    placeholder="接受者id"
                    value={this.state.receiver}
                />

                <TouchableHighlight underlayColor='ghostwhite' style={{width:100, alignItems: 'center', alignSelf:'center', marginTop:12}} onPress={this.handleLogin.bind(this)} >
                    <Text style={{padding:8}}>登录</Text>
                </TouchableHighlight>
            </View>
        );
        
    }
}
