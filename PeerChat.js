import {connect} from 'react-redux';
import {setUnread, updateConversation, setConversation} from './actions';
import {BasePeerChat} from "./chat/PeerChat.js";
import ConversationDB from './model/ConversationDB';

class PeerChat extends BasePeerChat {
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
        this.props.dispatch(setUnread("p_" + this.props.receiver, 0));
        this.props.dispatch(setConversation({}));
        ConversationDB.getInstance().setUnread("p_" + this.props.receiver, 0);        
    }

    addMessage(message) {
        super.addMessage(message);
        var conv = {
            cid:"p_" + this.props.receiver,
            unread:0,
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
        } else {
            conv.content = "";
        }
        this.props.dispatch(updateConversation(conv));
    }

}


PeerChat = connect(function(state){
    return {messages:state.messages};
})(PeerChat);

export default PeerChat;
