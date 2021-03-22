import {
    Platform,
} from 'react-native';

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
    
    parseMessageContent(m:IMessage) {
        var obj = JSON.parse(m.content);
        m.isOutgoing = (m.sender == this.props.sender);
        m.contentObj = obj;
        console.log("message obj:", obj);
        m.uuid = obj.uuid;
    }

    addMessage(message:IMessage, sending?) {
        super.addMessage(message, sending);
        if (!sending) {
            return;
        }
        this.props.emitter.emit('update_conversation_message', "p_" + this.props.receiver, message);
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

