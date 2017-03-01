
const PAGE_SIZE = 10;
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

    getMessage(msgID) {
        var p = new Promise((resolve, reject) => {
            this.db.executeSql("SELECT id, sender, receiver, timestamp, flags, content, attachment FROM peer_message WHERE id= ?",
                               [msgID],
                               function(result) {
                                   console.log("tt:", result);
                                   if (result.rows.length > 0) {
                                       var row = result.rows.item(0);
                                       console.log("get message result:", row);
                                       resolve(row);
                                   } else {
                                       reject("invalid msgid");
                                   }
                               },
                               function(error) {
                                   reject(error);
                               });
        });
        return p;
    }
    
    getConversations() {
        var p = new Promise((resolve, reject) => {
            this.db.executeSql("SELECT MAX(id) as id, peer FROM peer_message GROUP BY peer",
                               [],
                               function(result) {
                                   resolve(result);
                               },
                               function(error) {
                                   reject(error);
                               })

        });
        return p.then((result) => {
            var arr = [];
            for (var i = 0; i < result.rows.length; i++) {
                var row = result.rows.item(i);
                console.log("row:", row);
                var msgID = row.id;
                var p = this.getMessage(msgID);
                arr = arr.concat(p);
            }

            return Promise.all(arr);
        });
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

    updateAttachment(msgID, attachment) {
        this.db.executeSql('UPDATE peer_message SET attachment= ? WHERE id=?',
                           [attachment, msgID],
                           function(result) {
                               console.log("update attachment result:", result);
                           },
                           function(error) {
                               console.log("update attachment error:", error);
                           });           
    }

    updateFlags(msgID, flags) {
        this.db.executeSql('UPDATE peer_message SET flags= ? WHERE id=?',
                           [flags, msgID],
                           function(result) {
                               console.log("update flag result:", result);
                           },
                           function(error) {
                               console.log("update error:", error);
                           });        
    }
    
    //获取最近聊天记录
    getMessages(uid, successCB, errCB) {
        var sql = "SELECT id, sender, receiver, timestamp, flags, content, attachment FROM peer_message  WHERE peer = ? ORDER BY id DESC LIMIT ?";
        this.db.executeSql(sql, [uid, PAGE_SIZE],
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
        var sql = "SELECT id, sender, receiver, timestamp, flags, content FROM peer_message, attachment WHERE peer = ? AND id < ? ORDER BY id DESC LIMIT ?";
        this.db.executeSql(sql, [uid, msgID, PAGE_SIZE],
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
    
}
