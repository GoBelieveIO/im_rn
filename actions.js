
//会话列表
export const SET_CONVERSATIONS = "set_conversations";
export const ADD_CONVERSATION = "add_conversation";
export const UPDATE_CONVERSATION = "update_conversation";
export const SET_UNREAD = "set_unread";
export const SET_LATEST_MESSAGE = "set_latest_message";


//单个会话, 只支持一个
export const SET_CONVERSATION = "set_conversation";


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

export function updateConversation(conv, index) {
    return {
        type:UPDATE_CONVERSATION,
        conversation:conv,
        index:index
    };
}

export function setUnread(cid, unread) {
    return {
        type:SET_UNREAD,
        cid:cid,
        unread:unread
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
