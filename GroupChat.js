import {BaseGroupChat} from "./chat/GroupChat.js"
import {connect} from 'react-redux'

import ConversationDB from './model/ConversationDB'

import {setUnread, updateConversation} from './actions'
import {setConversation} from './actions';

class GroupChat extends BaseGroupChat {
 

    static navigatorStyle = {
        navBarBackgroundColor: '#4dbce9',
        navBarTextColor: '#ffff00',
        navBarSubtitleTextColor: '#ff0000',
        navBarButtonColor: '#ffffff',
        statusBarTextColorScheme: 'light',
    };
    
    constructor(props) {
        super(props);
    }




    componentWillUnmount() {
        super.componentWillUnmount();

        this.props.dispatch(setUnread("g_" + this.props.receiver, 0));
        this.props.dispatch(setConversation({}));

        ConversationDB.getInstance().setUnread("g_" + this.props.receiver, 0);
    }


    
    addMessage(message) {
        super.addMessage(message);
        var conv = {
            cid:"g_" + this.props.receiver,
            message:message,
            timestamp:message.timestamp,
            name:this.props.name,
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
    }
}



GroupChat = connect(function(state){
    return {messages:state.messages};
})(GroupChat);

export default GroupChat;
