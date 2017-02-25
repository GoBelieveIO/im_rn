
import {
    SET_CONVERSATIONS,
    ADD_CONVERSATION,
    UPDATE_CONVERSATION,
    SET_UNREAD,
    SET_LATEST_MESSAGE,

    SET_CONVERSATION,

} from './actions';



export function profileReducer(state={}, action) {
    switch(action.type) {
        case "set_profile":
            return action.profile;
        default:
            return state;
    }
    
}



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
                index = state.findIndex((c) => {
                    return conv.cid == c.cid;
                });
            }

            if (index != -1) {
                //update
                conv = Object.assign({}, state[index], conv);
                return [...state.slice(0, index), conv, ...state.slice(index+1, state.length)];
            } else {
                //add
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
        default:
            return state;
    }
}
