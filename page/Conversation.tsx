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

//import moment from 'moment/min/moment-with-locales.min';
import moment from 'moment';


import {
    MESSAGE_FLAG_ACK, 
    MESSAGE_FLAG_FAILURE,
    CONVERSATION_PEER,
    CONVERSATION_GROUP,
    Conversation as IConversation,
    Message as IMessage
} from '../model/IMessage';

import PeerMessageDB from '../model/PeerMessageDB';
import GroupMessageDB from '../model/GroupMessageDB';
import ConversationDB from '../model/ConversationDB';

import PeerChat from "./PeerChat";
import {ENABLE_NATIVE_NAVIGATOR} from "../config";

import IMService from "../imsdk/im";

interface Props {
    uid:number;
    token:string;
    testPeer:number;
    emitter:any;
    history:any;
    navigator:any;
    im:IMService;
}

interface Stat {
    conversations:IConversation[];
}

class Conversation extends React.Component<Props, Stat> {
    constructor(props) {
        super(props);
        this.state = {
            conversations:[],
        };

        var im = this.props.im;
        im.observer = this;
    }
    
    componentDidMount() {
        if (ENABLE_NATIVE_NAVIGATOR) {
            this.props.navigator.setTitle("会话");
        }

        this.props.emitter.on("clear_conversation_unread", this.onClearConversationUnread, this);
        this.loadConversations();
    }

    componetWillUnmount() {
        var im = this.props.im;
        im.observer = undefined;
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
                           var conv:IConversation = {
                               cid:cid,
                               name:cid,
                               avatar:"",
                               timestamp:m.timestamp,
                               unread:0,
                               message:m,
                               type:CONVERSATION_PEER
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
                           var conv:IConversation = {
                               cid:cid,
                               name:cid,
                               avatar:"",
                               timestamp:m.timestamp,
                               unread:0,
                               message:m,
                               type:CONVERSATION_GROUP
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
    

    handlePeerMessage(m) {
        console.log("handle peer message:", m);
        var contentObj = JSON.parse(m.content);
        var msg:IMessage = {
            id:0,
            sender:m.sender,
            receiver:m.receiver,
            content:m.content,
            timestamp:m.timestamp,
            contentObj:contentObj,
            flags:0,
        };

        msg.isOutgoing = (this.props.uid == m.sender);
        
        var peer = (this.props.uid == m.sender) ? m.receiver : m.sender;

        var db = PeerMessageDB.getInstance();
        db.insertMessage(msg, peer)
          .then((rowid) => {
              msg.id = rowid;

              this.props.emitter.emit('peer_message', msg)
          });

        var cid = "p_" + peer;
        var index = this.state.conversations.findIndex((conv) => {
            return conv.cid == cid;
        });
        
        var conv;
        if (index != -1) {
            var c = this.state.conversations[index];
            var newConv = Object.assign({}, c);
            if (this.props.uid != msg.sender) {
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
                timestamp:msg.timestamp,
                unread:0,
                message:msg,
            };
            if (this.props.uid != msg.sender) {
                conv.unread = 1;
                ConversationDB.getInstance().setUnread(conv.cid, conv.unread);
            }
        }

        conv.message = msg;
        conv.timestamp = msg.timestamp;
        if (msg.contentObj.text) {
            conv.content = msg.contentObj.text;
        } else if (msg.contentObj.image2) {
            conv.content = "一张图片";
        } else if (msg.contentObj.audio) {
            conv.content = "语音"
        } else if (msg.contentObj.location) {
            conv.content = "位置";
        } else {
            conv.content = "未知消息格式";
        }
        
        console.log("new conv:", newConv);
        this.updateConversation(conv, index);
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
        message.outgoing = (this.props.uid == message.sender);
        
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
        /*
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
        this.updateConversation(conv, index);*/
    }

    onClearConversationUnread(cid) {
        var index = this.state.conversations.findIndex((conv) => {
            return conv.cid == cid;
        });
        if (index != -1) {
            var c = this.state.conversations[index];
            if (c.unread  != 0) {
                c.unread = 0;
                ConversationDB.getInstance().setUnread(c.cid, 0);
                this.setState({});
            }
        }
    }

    renderRow(row) {
        var conv = row.item;
        var self = this;

        function onPress() {
            console.log("row data:", conv);
            if (conv.cid.startsWith("p_")) {
                var uid = parseInt(conv.cid.substr(2));
                if (ENABLE_NATIVE_NAVIGATOR) {
                    var im = self.props.im;
                    self.props.navigator.push("PeerChat", {
                        emitter:self.props.emitter,
                        im:im,
                        sender: self.props.uid,
                        receiver:uid,
                        peer:uid,
                        name:conv.name
                    });
                } else {
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

        var now = new Date();
        var ts = now.setTime(conv.timestamp*1000);

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
                                   source={require("../Images/default.png")}/>
                            
                            {reanderUnread()}
                        </View>
                        <View style={{flex:1, height:40, marginLeft:12}}>
                            <View style={{flex:1, flexDirection:"row",  justifyContent: 'space-between'}}>
                                <Text style={{fontWeight:"bold"}}>
                                    {conv.name}
                                </Text>
                                <Text style={{fontWeight:"100", fontSize:12, marginRight:8}}>
                                    {moment(ts).locale('zh-cn').format('LT')}
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
                        var im = this.props.im;
                        return (<PeerChat im={im} emitter={this.props.emitter} {...state}></PeerChat>);
                    }}></Route>
                </Switch>
            </View>
        );        
    }
}

export default withRouter(Conversation);
