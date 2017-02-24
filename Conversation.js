import React from 'react';
import {
    Platform,
    Text,
    View,
    Image,
    ListView,
    TouchableWithoutFeedback,
    TouchableHighlight
} from 'react-native';


import {connect} from 'react-redux'
import RCTDeviceEventEmitter from 'RCTDeviceEventEmitter';
import moment from 'moment/min/moment-with-locales.min';

import {setConversations, setUnread} from './chat/actions'

var IMService = require("./chat/im");

import PeerMessageDB from './chat/PeerMessageDB';
import GroupMessageDB from './chat/GroupMessageDB';

class Conversation extends React.Component {
    constructor(props) {
        super(props);

        const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
        this.state = {
            dataSource: ds.cloneWithRows([
            ])
        };
    }

    
    componentWillMount() {
        var db = PeerMessageDB.getInstance();
        
        var p1 = db.getConversations()
                   .then((messages) => {
                       var convs = [];
                       for (var i in messages) {
                           var m = messages[i];
                           console.log("m:", m, "uid:", this.props.uid);
                           var cid = (m.sender == this.props.uid) ? m.receiver : m.sender;
                           cid = "p_" + cid;
                           var conv = {
                               id:cid,
                               cid:cid,
                               name:cid,
                               timestamp:m.timestamp,
                               unread:0,
                               message:m,
                           }
                           var msgObj = JSON.parse(m.content);
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
                           
                           convs = convs.concat(conv);
                       }

                       console.log("conversations:", convs);
                       return convs;

                   });



        db = GroupMessageDB.getInstance();
        
        var p2 = db.getConversations()
                   .then((messages) => {
                       var convs = [];
                       for (var i in messages) {
                           var m = messages[i];
                           m.receiver = m.group_id;
                           
                           var cid = "g_" + m.receiver;
                           var conv = {
                               id:cid,
                               cid:cid,
                               name:cid,
                               timestamp:m.timestamp,
                               unread:0,
                               message:m,
                           }
                           var msgObj = JSON.parse(m.content);
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
                           
                           convs = convs.concat(conv);
                       }

                       console.log("conversations:", convs);
                       return convs
                   });

        Promise.all([p1, p2]).then((results) => {
            var convs = results[0].concat(results[1]);
            this.props.dispatch(setConversations(convs));
        }).catch((err) => {
            
        })

    }
    
    componentWillReceiveProps(nextProps) {
        if (this.props.conversations === nextProps.conversations) {
            return;
        }
        this.setState({
            dataSource: this.state.dataSource.cloneWithRows(nextProps.conversations)
        });
    }
    
    renderRow(conv) {
        var navigator = this.props.navigator;
        var self = this;
        function onPress() {
            console.log("row data:", conv);

            if (conv.cid.startsWith("p_")) {
                var uid = parseInt(conv.cid.substr(2));
                navigator.push({
                    title:"Chat",
                    screen:"chat.PeerChat",
                    passProps:{
                        sender:self.props.uid,
                        receiver:uid,
                        token:self.props.token,
                    },
                });
            } else if (conv.cid.startsWith("g_")) {
                var gid = parseInt(conv.cid.substr(2));
                navigator.push({
                    title:"Chat",
                    screen:"chat.GroupChat",
                    passProps:{
                        sender:self.props.uid,
                        receiver:gid,
                        token:self.props.token,
                    },
                });                
            }
        }

        var t = new Date();
        t = t.setTime(conv.timestamp*1000);

        var reanderUnread = function() {
            if (conv.unread > 0) {
                return (
                    <View style={{backgroundColor:"red",
                                  position:"absolute",
                                  left:32,
                                  top:0,
                                  width:16,
                                  height:16,
                                  borderRadius:90,
                                  alignItems:"center",
                                  justifyContent:"center"}}>
                        <Text style={{fontSize:8}}>
                            {"" + conv.unread}
                        </Text>
                    </View>
                );
            } else {
                return null;
            }
        }

        return (
            <TouchableHighlight
                style={{flex:1, height:64, backgroundColor:"white"}}
                activeOpacity={0.6}
                underlayColor={"gray"}
                onPress={onPress}>
                <View style={{flex:1}}>

                    <View style={{flex:1,
                                  height:64,
                                  flexDirection:"row",
                                  alignItems:"center"}}>

                        <View style={{marginLeft:12, width:48, height:48}}>
                            <Image style={{ position:"absolute",
                                            left:0,
                                            top:8,
                                            width:40,
                                            height:40}}
                                   source={require("./Images/default.png")}/>
                            
                            {reanderUnread()}
                        </View>
                        <View style={{flex:1, height:40, marginLeft:12}}>
                            <View style={{flex:1, flexDirection:"row",  justifyContent: 'space-between'}}>
                                <Text style={{fontWeight:"bold"}}>
                                    {conv.name}
                                </Text>
                                <Text style={{fontWeight:"100", fontSize:12, marginRight:8}}>
                                    {moment(t).locale('zh-cn').format('LT')}
                                </Text>
                            </View>
                            <Text numberOfLines={1} style={{marginRight:16}}>
                                {conv.content}
                            </Text>
                        </View>
                    </View>
                    
                    <View style={{ height:1, backgroundColor:"gray"}}/>
                </View>
            </TouchableHighlight>
        );
    }

    
    render() {
        return (
            <View style={{flex: 1, marginTop:4}}>
                <ListView
                    enableEmptySections={true}
                    dataSource={this.state.dataSource}
                    renderRow={this.renderRow.bind(this)}
                />
            </View>
        );        
    }

    
}

Conversation = connect(function(state){
    return {
        conversations:state.conversations,
    };
})(Conversation);

export default Conversation;
