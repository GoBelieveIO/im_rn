
//会话列表
export const SET_CONVERSATIONS = "set_conversations";
export const ADD_CONVERSATION = "add_conversation";
export const SET_UNREAD = "set_unread";
export const SET_LATEST_MESSAGE = "set_latest_message";


//单个会话, 只支持一个
export const SET_CONVERSATION = "set_conversation";

export const SET_MESSAGES = "set_messages";
export const ADD_MESSAGE = "add_message";
export const ACK_MESSAGE = "ack_message";





export function setConversations(conversations) {
    return {
        type:SET_CONVERSATIONS,
        conversations:conversations
    };
}

export function addConversation(conv) {
    return {
        type:ADD_CONVERSATION,
        conversation:conv
    };
}

export function setUnread(cid) {
    return {
        type:SET_UNREAD,
        cid:cid
    };
}

export function setLatestMessage(message) {
    return {
        type:SET_LATEST_MESSAGE,
        message:message
    };
}

export function setConversation(conversation) {
    return {
        type:SET_CONVERSATION,
        conversation:conversation
    };
}

export function setMessages(messages) {
    return {
        type:SET_MESSAGES,
        messages:messages
    }
}

export function addMessage(message) {
    return {
        type:ADD_MESSAGE,
        message:message
    }
}

export function ackMessage(msgID) {
    return {
        type:ACK_MESSAGE,
        msgID:msgID
    }
}


