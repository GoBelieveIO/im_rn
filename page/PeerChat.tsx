import PeerMessageDB from '../model/PeerMessageDB';
import {
    MESSAGE_FLAG_FAILURE, 
    MESSAGE_FLAG_LISTENED,
    Message as IMessage
} from '../model/IMessage';
import PropTypes from 'prop-types';
var IMService = require("../imsdk/im");
import Chat from './Chat';
import Navigator from "../Navigation";
import {MESSAGE_LIST_INVERTED, ENABLE_NATIVE_NAVIGATOR} from "../config";

export default class PeerChat extends Chat {
    static childContextTypes = {
        getLocale:PropTypes.func
    };

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        super.componentDidMount();

        if (ENABLE_NATIVE_NAVIGATOR && this.props.name) {
            Navigator.setTitle(this.props.name);
        }
        this.props.emitter.on('peer_message',this.onPeerMessage, this);
        this.props.emitter.on('peer_message_ack', this.onPeerMessageACK, this);
        this.props.emitter.on('peer_message_failure', this.onPeerMessageFailure, this);

        var db = PeerMessageDB.getInstance();

        this.setState({loading:true});
        db.getMessages(this.props.receiver,
                       (msgs)=>{
                           if (!MESSAGE_LIST_INVERTED) {
                               msgs.reverse();
                           }
                           for (var i in msgs) {
                               var m = msgs[i];
                               this.parseMessageContent(m);
                               this.downloadAudio(m);
                           }
                           console.log("set messages:", msgs.length);
                           this.setState({messages:msgs, loading:false}, () => {
                                //this.scrollToBottom();
                           });
                       },
                       (e)=>{
                           console.log("err:", e);
                            this.setState({loading:false});
                       });

    }

    componentWillUnmount() {
        super.componentWillUnmount();

        this.props.emitter.emit('clear_conversation_unread', "p_" + this.props.receiver);


        this.props.emitter.off(this.onPeerMessage, this);
        this.props.emitter.off(this.onPeerMessageACK, this);
        this.props.emitter.off(this.onPeerMessageFailure, this);
    }

    onPeerMessage(message) {
        if (message.sender == this.props.peer ||
            message.receiver == this.props.peer) {
            this.downloadAudio(message);
            this.addMessage(message);
        }        
    }
    
    onPeerMessageACK(message) {
        if (message.sender == this.props.peer ||
            message.receiver == this.props.peer) {

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

    onPeerMessageFailure(message) {

    }
    
    parseMessageContent(m) {
        var obj = JSON.parse(m.content);
        var t = new Date();
        t.setTime(m.timestamp*1000);
        
        if (m.attachment) {
            console.log("attachment:", m.attachment);
        }
        
        m._id = m.id;
        m.outgoing = (m.sender == this.props.sender);
        
        console.log("obj:", obj);
        if (obj.text) {
            m.text = obj.text;
        } else if (obj.image2) {
            // if (obj.image2.fileName) {
            //     if (Platform.OS === 'ios') {
            //         var uri = AudioUtils.DocumentDirectoryPath + "/images/" + obj.image2.fileName;
            //         obj.image2.url = uri;
            //         console.log("image uri:", uri);
            //     }
            // }
            m.image = obj.image2;
            if (m.attachment) {
                m.image.url = m.attachment;
            }
        } else if (obj.audio) {
            console.log("auido message....");
            m.audio = obj.audio;
        } else if (obj.location) {
            m.location = obj.location;
        }
        m.uuid = obj.uuid;
        
        m.createdAt = t;
        m.user = {
            _id:m.sender
        };
    }

    addMessage(message, sending?) {
        super.addMessage(message, sending);
        if (!sending) {
            return;
        }
        // var conv = {
        //     cid:"p_" + this.props.receiver,
        //     unread:0,
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
        // } else {
        //     conv.content = "";
        // }

        this.props.emitter.emit('update_conversation_message', "p_" + this.props.receiver, message);
        //this.props.dispatch(updateConversation(conv));
    }

    saveMessage(message) {
        var db = PeerMessageDB.getInstance();
        return db.insertMessage(message, this.props.receiver);
    }

    updateMessageAttachment(msgID, attachment) {
        var db = PeerMessageDB.getInstance();
        db.updateAttachment(msgID, attachment);
    }

    setMessageListened(message) {
        super.setMessageListened(message);
        var f = message.flags | MESSAGE_FLAG_LISTENED;
        var db = PeerMessageDB.getInstance();
        db.updateFlags(message.id, f);
    }

    sendMessage(message) {
        var im = this.props.im;
        if (im.connectState == IMService.STATE_CONNECTED) {
            im.sendPeerMessage(message);
        }
    }

    loadMoreContentAsync() {
        if (this.state.loading) {
            return;
        }

        if (!this.state.canLoadMoreContent) {
            return;
        }

        if (this.state.messages.length == 0) {
            return;
        }

        if (MESSAGE_LIST_INVERTED) {
            var m = this.state.messages[this.state.messages.length - 1];
        } else {
            var m = this.state.messages[0];
        }

        console.log("load more content...:", m.id);
        this.setState({loading:true});
        var p = new Promise((resolve, reject) => {
            var db = PeerMessageDB.getInstance();
            db.getEarlierMessages(this.props.receiver, m.id,
                                  (messages) => {
                                      resolve(messages);
                                  },
                                  (err) => {
                                      console.log("err:", err);
                                      reject(err);
                                  });
        });

        p.then((messages:any[]) => {
            if (messages.length == 0) {
                this.setState({
                    canLoadMoreContent:false,
                    loading:false
                })
                return;
            }
            if (!MESSAGE_LIST_INVERTED) {
                messages.reverse();
            }
            for (var i in messages) {
                var m = messages[i];
                this.parseMessageContent(m);
                this.downloadAudio(m);
            }
            var ms = this.state.messages;
            if (MESSAGE_LIST_INVERTED) {
                ms.splice(ms.length, 0, ...messages);
            } else {
                ms.splice(0, 0, ...messages);
            }
            this.setState({loading:false});
        });
    }
}

