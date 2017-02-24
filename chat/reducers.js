import {
    SET_CONVERSATIONS,
    ADD_CONVERSATION,
    UPDATE_CONVERSATION,
    SET_UNREAD,
    SET_LATEST_MESSAGE,

    SET_CONVERSATION,

    SET_MESSAGES,
    ADD_MESSAGE,
    INSERT_MESSAGES,
    ACK_MESSAGE,
    PLAY_MESSAGE,
    LISTEN_MESSAGE,
} from './actions';

import {MESSAGE_FLAG_LISTENED} from "./IMessage";

//当前会话
export function conversationReducer(state={}, action) {
    switch(action.type) {
        case "set_conversation":
            return action.conversation;
        default:
            return state;
    }
    
}

//会话列表
export function conversationsReducer(state=[], action) {
    switch(action.type) {
        case "set_conversations":
            return action.conversations;
        case "add_conversation":
            return [action.conversation].concat(state);
        case 'update_conversation': 
            var index = action.index;
            var conv = action.conversation;
            if (!index || index == -1) {
                index = -1;
                for (var i in state) {
                    var c = state[i];
                    if (conv.cid == c.cid) {
                        index = i;
                        break;
                    }
                }
            }

            if (index != -1) {
                return [...state.slice(0, index), conv, ...state.slice(index+1, state.length)];
            } else {
                return [conv].concat(state)
            }
            
        case "set_unread":
            var convs = state.map(function(conv) {
                if (conv.cid == action.cid) {
                    return Object.assign({}, conv, {unread:action.unread});
                }
                return conv
            });
            return convs;
        case "set_latest_message":
            return state;
        default:
            return state;
    }
}

export function messagesReducer(state = [], action) {
    switch(action.type) {
        case "set_messages":
            return action.messages;
        case "add_message":
            return [action.message].concat(state);
        case "insert_messages":
            return state.concat(action.messages);
        case "ack_message":
            var index = -1;
            for (var i = 0; i < state.length; i++) {
                var m = state[i];
                if (m.id == action.msgID) {
                    index = i;
                    break;
                }
            }
            
            if (index == -1) {
                return state;
            } else {
                var m = Object.assign({}, state[index], {ack:true});
                return [...state.slice(0, index), m, ...state.slice(index+1, state.length)];
            }
            break;
        case PLAY_MESSAGE:
            var index = state.findIndex((m) => {
                return m.id == action.msgID;
            });
            if (index == -1) {
                return state;
            } else {
                var playing = state[index].playing ? state[index].playing : 0;
                if (action.playing) {
                    playing += 1;
                } else {
                    playing = 0;
                }
                var m = Object.assign({}, state[index], {playing:playing});
                return [...state.slice(0, index), m, ...state.slice(index+1, state.length)];
            }
        case LISTEN_MESSAGE:
            var index = state.findIndex((m) => {
                return m.id == action.msgID;
            });
            if (index == -1) {
                return state;
            } else {
                var f = state[index].flags;
                f = f | MESSAGE_FLAG_LISTENED;
                var m = Object.assign({}, state[index], {flags:f});
                return [...state.slice(0, index), m, ...state.slice(index+1, state.length)];
            }            
        default:
            return state;
    }
}


//do not use combineReducers ignore init state of createStore
function appReducer(state={}, action) {
    return {
        conversations:conversationsReducer(state.conversations, action),
        messages:messagesReducer(state.messages, action),
        conversation:conversationReducer(state.conversation, action),
    };
}

