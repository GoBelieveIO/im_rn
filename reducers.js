
//当前会话
function conversationReducer(state={}, action) {
    switch(action.type) {
        case "set_conversation":
            return action.conversation;
        default:
            return state;
    }
    
}

//会话列表
function conversationsReducer(state=[], action) {
    switch(action.type) {
        case "set_conversations":
            return action.conversations;
        case "add_conversation":
            return [action.conversation].concat(state);
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

function messagesReducer(state = [], action) {
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

module.exports = appReducer;
