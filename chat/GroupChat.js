import React from 'react';
import {
    Platform,
} from 'react-native';

import {connect} from 'react-redux'
import RCTDeviceEventEmitter from 'RCTDeviceEventEmitter';
import {AudioUtils} from 'react-native-audio';

import GroupMessageDB from './GroupMessageDB.js'
import {setMessages, addMessage, insertMessages, ackMessage} from './actions'
import {setUnread, updateConversation} from './actions'
import {setConversation} from './actions';
import {MESSAGE_FLAG_FAILURE, MESSAGE_FLAG_LISTENED} from './IMessage';

var IMService = require("./im");

import Chat from './Chat';

export class BaseGroupChat extends Chat {
    constructor(props) {
        super(props);
    }

    componentWillMount() {
        super.componentWillMount();
        
        var im = IMService.instance;
        im.addObserver(this);

        this.listener = RCTDeviceEventEmitter.addListener('group_message',
                                                          (message)=>{
                                                              this.downloadAudio(message);
                                                              this.props.dispatch(addMessage(message));
                                                              this.scrollToBottom();
                                                          });


        var db = GroupMessageDB.getInstance();

        db.getMessages(this.props.receiver,
                       (msgs)=>{
                           for (var i in msgs) {
                               var m = msgs[i];
                               m.receiver = m.group_id;
                               this.parseMessageContent(m);
                               this.downloadAudio(m);
                           }
                           console.log("set messages:", msgs.length);
                           this.props.dispatch(setMessages(msgs));
                       },
                       (e)=>{});

        this.props.dispatch(setConversation({cid:"g_" + this.props.receiver}));        
    }


    componentWillUnmount() {
        super.componentWillUnmount();
        
        var im = IMService.instance;
        im.removeObserver(this);

        this.listener.remove();

        this.props.dispatch(setUnread("g_" + this.props.receiver, 0));
        this.props.dispatch(setConversation({}));
    }

    parseMessageContent(m) {
        var obj = JSON.parse(m.content);
        var t = new Date();
        t.setTime(m.timestamp*1000);

        m._id = m.id;

        console.log("obj:", obj);
        if (obj.text) {
            m.text = obj.text;
        } else if (obj.image2) {
            if (obj.image2.fileName) {
                if (Platform.OS === 'ios') {
                    var uri = AudioUtils.DocumentDirectoryPath + "/images/" + obj.image2.fileName;
                    obj.image2.url = uri;
                    console.log("image uri:", uri);
                }
            }
            m.image = obj.image2
        } else if (obj.audio) {
            console.log("auido message....");
            m.audio = obj.audio;
        } else if (obj.location) {
            m.location = obj.location;
        } else if (obj.notification) {
            var notification = "";
            var n = JSON.parse(obj.notification);
            if (n.create) {
                if (n.create.master == this.props.sender) {
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
            m.notification = notification;
        }
        
        m.uuid = obj.uuid;
        m.createdAt = t;
        m.user = {
            _id:m.sender
        };
        m.outgoing = (this.sender == m.sender);
    }

    addMessage(message) {
        this.props.dispatch(addMessage(message));
        var conv = {
            id:"g_" + this.props.receiver,
            cid:"g_" + this.props.receiver,
            name:"g_" + this.props.receiver,
            unread:0,
            message:message,
            timestamp:message.timestamp,
            
        }
        var msgObj = JSON.parse(message.content);
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
                if (n.create.master == this.props.sender) {
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
            m.notification = notification;
        } else {
            conv.content = "";
        }
        this.props.dispatch(updateConversation(conv));
        
        this.scrollToBottom();
    }

    
    saveMessage(message) {
        var db = GroupMessageDB.getInstance();
        var p = new Promise((resolve, reject) => {
            db.insertMessage(message, 
                             function(rowid) {
                                 console.log("row id:", rowid);
                                 resolve(rowid);
                             },
                             function(err) {
                                 reject(err);
                             });
            
        });
        return p;
    }

    setMessageListened(message) {
        var f = message.flags | MESSAGE_FLAG_LISTENED;
        var db = GroupMessageDB.getInstance();
        db.updateFlags(message.id, f);
    }

    sendMessage(message) {
        var im = IMService.instance;
        if (im.connectState == IMService.STATE_CONNECTED) {
            im.sendGroupMessage(message);
        }
    }

    _loadMoreContentAsync = async () => {
        if (this.props.messages.length == 0) {
            return;
        }
        var m = this.props.messages[this.props.messages.length - 1];

        console.log("load more content...:", m.id);
        var p = new Promise((resolve, reject) => {
            var db = GroupMessageDB.getInstance();
            db.getEarlierMessages(this.props.receiver, m.id,
                                  (messages) => {
                                      resolve(messages);
                                  },
                                  (err) => {
                                      reject(err);
                                  });
        });

        messages = await p;

        if (messages.length == 0) {
            this.setState({
                canLoadMoreContent:false
            })
            return;
        }
        for (var i in messages) {
            var m = messages[i];
            this.parseMessageContent(m);
            this.downloadAudio(m);
        }

        this.props.dispatch(insertMessages(messages));
        return;
    }
}


var GroupChat = connect(function(state){
    return {messages:state.messages};
})(BaseGroupChat);

export default GroupChat;
