import React from 'react';
import {
    Platform,
    Text,
    View,
    Image,
    FlatList,
    TouchableWithoutFeedback,
    TouchableHighlight
} from 'react-native';

import { Switch, Route, withRouter } from "react-router";  

import moment from 'moment/min/moment-with-locales.min';

var IMService = require("./chat/im");

import {MESSAGE_FLAG_ACK, MESSAGE_FLAG_FAILURE} from './chat/IMessage';
import PeerMessageDB from './chat/PeerMessageDB';
import GroupMessageDB from './chat/GroupMessageDB';
import ConversationDB from './model/ConversationDB';

import PeerChat from "./chat/PeerChat";
import Navigator from "./Navigation";

const CONVERSATION_PEER = "peer";
const CONVERSATION_GROUP = "group";

class Conversation extends React.Component {
    static navigatorButtons = {
        rightButtons: [
            {
                title: '搜索', 
                id: 'search', 
                showAsAction: 'ifRoom' 
            },
        ]
    };

    
    static navigatorStyle = {
        navBarBackgroundColor: '#4dbce9',
        navBarTextColor: '#ffff00',
        navBarSubtitleTextColor: '#ff0000',
        navBarButtonColor: '#ffffff',
        statusBarTextColorScheme: 'light',
    };
    
    
    constructor(props) {
        super(props);

      
        this.state = {
            conversations:[],
        };
        //this.props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
    }

    onNavigatorEvent(event) {
        console.log("event:", event);
        if (event.type == 'NavBarButtonPress') { 
            if (event.id == 'search') {
                var navigator = this.props.navigator;
                navigator.push({
                    title:"Search",
                    screen:"demo.Search",
                    navigatorStyle:{
                        tabBarHidden:true
                    },
                    passProps:{

                    },
                });                
            }
        }
    }

    
    componentDidMount() {
        var im = IMService.instance;
        im.observer = this;
        
        this.loadConversations();
    }

    loadConversations() {
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
                           } else if (msgObj.notification) {
                               var notification = "";
                               var n = JSON.parse(msgObj.notification);
                               if (n.create) {
                                   if (n.create.master == this.props.uid) {
                                       notification = `您创建了${n.create.name}群组`;
                                   } else {
                                       notification = `您加入了${n.create.name}群组`;
                                   }
                               } else if (n.add_member) {
                                   notification = `${n.add_member.name}加入群`;
                               } else if (n.quit_group) {
                                   notification = `${n.quit_group.name}离开群`;
                               } else if (n.disband) {
                                   notification = "群组已解散";
                               }
                               conv.content = notification;
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

            if (convs.length == 0 && this.props.testPeer) {
                //test
                var conv = {
                    cid:"p_" + this.props.testPeer,
                    type:CONVERSATION_PEER,
                    peer:this.props.testPeer,
                    name:"p_" + this.props.testPeer,
                    unread:0,
                    content:"",
                    timestamp:0,
                 }
                convs = [conv];
            }
            this.setState({conversations:convs});
        }).catch((err) => {
            console.error("err:", err);
        })
    }
    
    componetWillUnmount() {
        var im = IMService.instance;
        im.observer = undefined;
    }
    
    handlePeerMessage(message) {
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
        message.outgoing = (this.uid == message.sender);
        
        var peer = (this.uid == message.sender) ? message.receiver : message.sender;
        var db = PeerMessageDB.getInstance();
        db.insertMessage(message, peer)
          .then((rowid) => {
              message.id = rowid;
              message._id = rowid;
              this.props.emitter.emit('peer_message', message)
          });

        cid = "p_" + peer;
        var index = this.state.conversations.findIndex((conv) => {
            return conv.cid == cid;
        });
        
        var conv;
        if (index != -1) {
            var c = this.state.conversations[index];
            var newConv = Object.assign({}, c);
            if (this.props.uid != message.sender) {
                newConv.unread = newConv.unread + 1;
                ConversationDB.getInstance().setUnread(newConv.cid, newConv.unread);
            }
            conv = newConv;
        } else {
            conv = {
                cid:cid,
                type:CONVERSATION_PEER,
                peer:peer,
                name:cid,
                timestamp:message.timestamp,
                unread:0,
                message:message,
            };
            if (this.props.uid != message.sender) {
                conv.unread = 1;
                ConversationDB.getInstance().setUnread(conv.cid, conv.unread);
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
        this.updateConversation(conv, index);
        //this.props.dispatch(updateConversation(conv, index));
    }

    updateConversation(conv, index) {
        if (!index || index == -1) {
            index = this.state.conversations.findIndex((c) => {
                return conv.cid == c.cid;
            });
        }

        if (index != -1) {
            //update
            Object.assign(this.state.conversations[index], conv);
    
            this.setState({});
        } else {
            //add
            this.state.conversations.splice(0, 0, conv);
        }
    }

    handleMessageACK(msg) {
        console.log("handle message ack");
        var db = PeerMessageDB.getInstance();
        db.updateFlags(msg.id, MESSAGE_FLAG_ACK);
        this.props.emitter.emit('peer_message_ack', msg);
    }

    handleMessageFailure(msg) {
        var db = PeerMessageDB.getInstance();
        db.updateFlags(msg.id, MESSAGE_FLAG_FAILURE);
        this.props.emitter.emit('peer_message_failure', msg);
    }
    
    handleGroupMessage(message) {
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
        message.outgoing = (this.uid == message.sender);
        
        var db = GroupMessageDB.getInstance();
        db.insertMessage(message)
          .then((rowid) => {
              message.id = rowid;
              message._id = rowid;
              this.props.emitter.emit('group_message', message);
          });


        var cid =  "g_" + message.receiver;
        var groupID = message.receiver;
        
        var index = this.state.conversations.findIndex((conv) => {
            return conv.cid == cid;
        });
        var conv;
        if (index != -1) {
            var c = this.state.conversations[index];
            var newConv = Object.assign({}, c);
            if (this.props.uid != message.sender) {
                newConv.unread = newConv.unread + 1;
                ConversationDB.getInstance().setUnread(newConv.cid, newConv.unread);
            }
            conv = newConv;
        } else {
            conv = {
                cid:cid,
                type:CONVERSATION_GROUP,
                groupID:groupID,
                name:cid,
                timestamp:message.timestamp,
                unread:0,
                message:message,
            };
      
            if (this.props.uid != message.sender) {
                conv.unread = 1;
                ConversationDB.getInstance().setUnread(conv.cid, conv.unread);
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

        //index==-1 表示添加
        console.log("new conv:", newConv);
        this.updateConversation(conv, index);
//        this.props.dispatch(updateConversation(conv, index));
    }

    handleGroupMessageACK(msg) {
        console.log("handle group message ack");
        var db = GroupMessageDB.getInstance();
        db.updateFlags(msg.id, MESSAGE_FLAG_ACK);
        this.props.emitter.emit('group_message_ack', msg);
    }

    handleGroupMessageFailure(msg) {
        var db = GroupMessageDB.getInstance();
        db.updateFlags(msg.id, MESSAGE_FLAG_FAILURE);
        this.props.emitter.emit('group_message_failure', msg);
    }

    handleGroupNotification(msg) {
        console.log("group notification:", msg);
        var obj = JSON.parse(msg);
        
        var db = GroupDB.getInstance();
        var notification = "";
        var timestamp = 0;
        var groupID = 0;
        var groupName = "";
        if (obj.create) {
            groupID = obj.create.group_id;
            timestamp = obj.create.timestamp;
            groupName = obj.create.name;
            db.insertGroup({id:obj.create.group_id,
                            name:obj.create.name,
                            master:obj.create.master,
                            timestamp:obj.create.timestamp,
                            members:obj.create.members});

            if (obj.create.master == this.uid) {
                notification = `您创建了${obj.create.name}群组`;
            } else {
                notification = `您加入了${obj.create.name}群组`;
            }

            var group = {
                id:groupID,
                name:groupName,
                timestamp:timestamp,
                master:obj.create.master
            };
            this.groups.push(group);
        } else if (obj.add_member) {
            groupID = obj.add_member.group_id;
            timestamp = obj.add_member.timestamp;
            groupName = obj.add_member.name;            
            db.addGroupMember(obj.add_member.group_id, obj.add_member.member_id);
            notification = `${obj.add_member.name}加入群`;
        } else if (obj.quit_group) {
            groupID = obj.quit_group.group_id;
            timestamp = obj.quit_group.timestamp;
            groupName = obj.quit_group.name;
            db.removeGroupMember(obj.quit_group.group_id, obj.quit_group.member_id);
            notification = `${obj.quit_group.name}离开群`;
        } else if (obj.disband) {
            groupID = obj.disband.group_id;
            timestamp = obj.disband.timestamp;
            groupName = obj.disband.name;
            db.disbandGroup(obj.disband.group_id);
            notification = "群组已解散";
        }
        
        console.log("group notification:", notification);

        var message = {};
        message.groupID = groupID;
        message.sender = 0;
        message.receiver = groupID;
        message.flags = 0;
        message.notification = notification;
        message.uuid = "";
        message.timestamp = timestamp;
        message.content = JSON.stringify({uuid:"", notification:msg});
        
        var t = new Date();
        t.setTime(message.timestamp*1000);
        message.createdAt = t;
        message.user = {
            _id: 0
        }
        message.outgoing = false;
        
        var db = GroupMessageDB.getInstance();
        db.insertMessage(message)
          .then((rowid) => {
              message.id = rowid;
              message._id = rowid;
              this.props.emitter.emit('group_message', message);
          });


        var cid =  "g_" + message.receiver;
        var index = this.state.conversations.findIndex((conv) => {
            return conv.cid == cid;
        });

        var conv;
        if (index != -1) {
            var c = this.state.conversations[index];
            var newConv = Object.assign({}, c);
            if (this.props.uid != message.sender) {
                newConv.unread = newConv.unread + 1;
            }
            conv = newConv;
        } else {
            conv = {
                cid:cid,
                type:CONVERSATION_GROUP,
                groupID:groupID,
                name:cid,
                timestamp:message.timestamp,
                unread:1,
                message:message,
            };

            var group = this.groups.find((group)=> {
                return group.id == conv.groupID;
            });
            if (groupName) {
                conv.name = groupName;
            }
        }

        conv.message = message;
        conv.timestamp = message.timestamp;
        conv.content = notification;
        console.log("new conv:", newConv);
        this.updateConversation(conv, index);
        //this.props.dispatch(updateConversation(conv, index));
    }

    
    // componentWillReceiveProps(nextProps) {
    //     if (this.props.conversations === nextProps.conversations) {
    //         return;
    //     }
    //     this.setState({
    //         dataSource: this.state.dataSource.cloneWithRows(nextProps.conversations)
    //     });
    // }
    
    renderRow(row) {
        var conv = row.item;

        var self = this;
        function onPress() {
            console.log("row data:", conv);
            if (conv.cid.startsWith("p_")) {
                var uid = parseInt(conv.cid.substr(2));
                var loc = {
                    pathname: "/conversations/" + conv.cid,
                    state: {
                        sender: self.props.uid,
                        receiver:uid,
                        peer:uid,
                        name:conv.name,
                        token: self.props.token,
                    }
                };
                self.props.history.push(loc);

        }
        //     if (conv.cid.startsWith("p_")) {
        //         var uid = parseInt(conv.cid.substr(2));
        //         var passProps = {
        //             sender:self.props.uid,
        //             receiver:uid,
        //             peer:uid,
        //             name:conv.name,
        //             token:self.props.token,
        //         };
        //         Navigator.push("PeerChat", passProps);
        // }

/*
            var navigator = self.props.navigator;
            if (conv.cid.startsWith("p_")) {
                var uid = parseInt(conv.cid.substr(2));
                navigator.push({
                    title:"Chat",
                    screen:"chat.PeerChat",
                    passProps:{
                        sender:self.props.uid,
                        receiver:uid,
                        peer:uid,
                        name:conv.name,
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
                        groupID:gid,
                        name:conv.name,
                        token:self.props.token,
                    },
                });                
            }*/
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
                <Switch>
                    <Route exact path="/conversations" render={() => {
                        return (<FlatList 
                            data={this.state.conversations}
                            renderItem={this.renderRow.bind(this)}
                            keyExtractor={(item, index) => {return "" + item.cid}}>

                        </FlatList>);
                    }}></Route>

                    <Route path="/conversations/:cid" render={(routeProps) => {
                        var state = routeProps.location.state;
                        return (<PeerChat emitter={this.props.emitter} {...state}></PeerChat>);
                    }}></Route>
                </Switch>
     
                {/* <ListView
                    enableEmptySections={true}
                    dataSource={this.state.dataSource}
                    renderRow={this.renderRow.bind(this)}
                /> */}
            </View>
        );        
    }

    
}

export default withRouter(Conversation);
