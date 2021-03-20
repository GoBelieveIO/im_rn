import React from 'react';
import {
    Platform,
} from 'react-native';

import {AudioUtils} from 'react-native-audio';

import GroupMessageDB from '../model/GroupMessageDB.js'
import {MESSAGE_FLAG_FAILURE, MESSAGE_FLAG_LISTENED} from '../model/IMessage';

var IMService = require("../chat/im");

import Chat from './Chat';


export default class GroupChat extends Chat {
    constructor(props) {
        super(props);
    }

    componentWillMount() {
        super.componentWillMount();
        
        this.props.emitter.emit('clear_conversation_unread', "g_" + this.props.receiver);



        this.props.emitter.on('group_message', this.onGroupMessage, this);
        this.props.emitter.on('group_message_ack', this.onGroupMessageACK, this);
        
        var db = GroupMessageDB.getInstance();

        this.setState({loading:true});
        db.getMessages(this.props.receiver,
                       (msgs)=>{
                           for (var i in msgs) {
                               var m = msgs[i];
                               m.receiver = m.group_id;
                               this.parseMessageContent(m);
                               this.downloadAudio(m);
                           }
                           console.log("set messages:", msgs.length);
                           this.setState({messages:msgs, loading:false});
                       },
                       (e)=>{
                           console.log("err:", e);
                           this.setState({loading:false});
                       });
    }


    componentWillUnmount() {
        super.componentWillUnmount();
        this.props.emitter.off(this.onGroupMessage, this);
        this.props.emitter.off(this.onGroupMessageACK, this);
    }

    onGroupMessage(message) {
        if (message.receiver == this.props.groupID) {
            this.downloadAudio(message);
            this.addMessage(message);
        }
    }

    onGroupMessageACK(message) {
        if (message.receiver == this.props.groupID) {
            var messages = this.state.messages;

            var index = -1;
            for (var i = 0; i < messages.length; i++) {
                var m = messages[i];
                if (m.id == message.msgID) {
                    index = i;
                    break;
                }
            }
            
            if (index == -1) {
                return;
            }

            messages[index].ack = true;
            this.setState({});
        }
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
        m.outgoing = (this.props.sender == m.sender);
    }

 
    
    addMessage(message, sending?) {
        super.addMessage(message, sending);
        if (!sending) {
            return;
        }
        // var conv = {
        //     cid:"g_" + this.props.receiver,
        //     message:message,
        //     timestamp:message.timestamp,
        //     name:this.props.name,
        // }
        
        // var msgObj = JSON.parse(message.content);
        // if (msgObj.text) {
        //     conv.content = msgObj.text;
        // } else if (msgObj.image2) {
        //     conv.content = "一张图片";
        // } else if (msgObj.audio) {
        //     conv.content = "语音"
        // } else if (msgObj.location) {
        //     conv.content = "位置";
        // } else if (msgObj.notification) {
        //     var notification = "";
        //     var n = JSON.parse(msgObj.notification);
        //     if (n.create) {
        //         if (n.create.master == this.props.sender) {
        //             notification = `您创建了${n.create.name}群组`;
        //         } else {
        //             notification = `您加入了${n.create.name}群组`;
        //         }
        //     } else if (n.add_member) {
        //         notification = `${n.add_member.name}加入群`;
        //     } else if (n.quit_group) {
        //         notification = `${n.quit_group.name}离开群`;
        //     } else if (n.disband) {
        //         notification = "群组已解散";
        //     }
        //     m.notification = notification;
        // } else {
        //     conv.content = "";
        // }

        this.props.emitter.emit('update_conversation_message', "g_" + this.props.receiver, message);

        //this.props.dispatch(updateConversation(conv));
    }

    saveMessage(message) {
        var db = GroupMessageDB.getInstance();
        return db.insertMessage(message);
    }

    updateMessageAttachment(msgID, attachment) {
        var db = GroupMessageDB.getInstance();
        db.updateAttachment(msgID, attachment);
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

    loadMoreContentAsync() {
        if (this.state.messages.length == 0) {
            return;
        }
        var m = this.state.messages[0];

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

        p.then((messages:any[]) => {
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
    
            var ms = this.state.messages;
            ms.splice(ms.length, 0, ...messages);
            this.setState({});
            return;
        });
    }
}

