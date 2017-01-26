

export const MESSAGE_FLAG_ACK = 2;
export const MESSAGE_FLAG_FAILURE = 8;
export const MESSAGE_FLAG_UPLOADING = 16;
export const MESSAGE_FLAG_SENDING = 32;
export const MESSAGE_FLAG_LISTENED = 64;


const PAGE_SIZE = 20;
var instance = null;
export default class PeerMessageDB {
    static getInstance() {
        if (!instance) {
            instance = new PeerMessageDB()
        }
        return instance;
    }

    
    constructor() {
        
    }

    setDB(db) {
        this.db = db;
        console.log("set db....");
    }
    
    insertMessage(msg, uid, successCB, errCB) {
        console.log("uid:", uid);
        this.db.executeSql('INSERT INTO peer_message (peer, sender, receiver, timestamp, flags, content) VALUES (?, ?, ?, ?, ?, ?)',
                           [uid, msg.sender, msg.receiver, msg.timestamp, msg.flags, msg.content],
                           function(result) {
                               console.log("insert result:", result);
                               successCB(result.insertId);
                           },
                           function(error) {
                               
                           });
    }

    //获取最近聊天记录
    getMessages(uid, successCB, errCB) {
        var sql = "SELECT id, sender, receiver, timestamp, flags, content FROM peer_message  WHERE peer = ? ORDER BY id DESC LIMIT 20";
        this.db.executeSql(sql, [uid],
                           function(result) {
                               console.log("get messages:", result);
                               var msgs = [];
                               for (var i = 0; i < result.rows.length; i++) {
                                   var row = result.rows.item(i);
                                   console.log("row:", row);
                                   msgs.push(row);
                               }

                               successCB(msgs);
                           },
                           function(e) {
                               errCB(e);
                           });
    }

    getEarlierMessages(uid, msgID, successCB, errCB) {
        var sql = "SELECT id, sender, receiver, timestamp, flags, content FROM peer_message WHERE peer = ? AND id < ? ORDER BY id DESC LIMIT 20";
        this.db.executeSql(sql, [uid, msgID],
                           function() {
                               console.log("get messages:", result);
                               var msgs = [];
                               for (var i = 0; i < result.rows.length; i++) {
                                   var row = result.rows.item(i);
                                   console.log("row:", row);
                                   msgs.push(row);
                               }
                               successCB(msgs);
                           },
                           function(e) {
                               errCB(e);
                           });   
    }
    
}
