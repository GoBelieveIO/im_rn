

import {BasePeerChat} from "./chat/PeerChat.js";



export default class PeerChat extends BasePeerChat {
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
        

        this.props.emitter.emit('clear_conversation_unread', "p_" + this.props.receiver);
        
        //this.props.dispatch(setUnread("p_" + this.props.receiver, 0));
        //this.props.dispatch(setConversation({}));
        //ConversationDB.getInstance().setUnread("p_" + this.props.receiver, 0);        
    }

    addMessage(message, sending) {
        super.addMessage(message, sending);
        if (!sending) {
            return;
        }
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

        this.props.emitter.emit('update_conversation_message', "p_" + this.props.receiver, message);
        //this.props.dispatch(updateConversation(conv));
    }

}


//PeerChat = connect(function(state){
//    return {messages:state.messages};
//})(PeerChat);

//export default PeerChat;
