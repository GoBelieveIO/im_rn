

export const SET_MESSAGES = "set_messages";
export const ADD_MESSAGE = "add_message";
export const INSERT_MESSAGES = "insert_messages";
export const ACK_MESSAGE = "ack_message";
export const PLAY_MESSAGE = "play_message";
export const LISTEN_MESSAGE = "listen_message";


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

export function insertMessages(messages) {
    return {
        type:INSERT_MESSAGES,
        messages:messages
    }
}

export function ackMessage(msgID) {
    return {
        type:ACK_MESSAGE,
        msgID:msgID
    }
}

//playing true:播放 false:停止播放
export function playMessage(msgID, playing) {
    return {
        type:PLAY_MESSAGE,
        msgID:msgID,
        playing:playing,
    }
}

export function listenMessage(msgID) {
    return {
        type:LISTEN_MESSAGE,
        msgID:msgID,
    }
}

