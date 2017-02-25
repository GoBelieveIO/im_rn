import {
    SET_MESSAGES,
    ADD_MESSAGE,
    INSERT_MESSAGES,
    ACK_MESSAGE,
    PLAY_MESSAGE,
    LISTEN_MESSAGE,
} from './actions';

import {MESSAGE_FLAG_LISTENED} from "./IMessage";

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

