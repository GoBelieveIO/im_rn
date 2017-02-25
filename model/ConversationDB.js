import {
    AsyncStorage
} from 'react-native';

export default class ConversationDB {
    static instance = null;
    static getInstance() {
        if (!ConversationDB.instance) {
            ConversationDB.instance = new ConversationDB()
        }
        return ConversationDB.instance;
    }

    setUnread(cid, unread) {
        return AsyncStorage.setItem(`${cid}_unread`, ""+unread);
    }

    getUnread(cid) {
        return AsyncStorage.getItem(`${cid}_unread`)
                           .then((r) => {
                               var u = parseInt(r);
                               if (isNaN(u)) {
                                   return 0;
                               } else {
                                   return u;
                               }
                           }).catch((error) => {
                               console.log("get unread err:", error);
                               return 0;
                           });
    }
}
