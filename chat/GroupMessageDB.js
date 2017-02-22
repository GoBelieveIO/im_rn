
const PAGE_SIZE = 10;
var instance = null;
export default class GroupMessageDB {
    static getInstance() {
        if (!instance) {
            instance = new GroupMessageDB()
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
            this.db.executeSql("SELECT id, sender, group_id, timestamp, flags, content FROM group_message WHERE id= ?",
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
            this.db.executeSql("SELECT MAX(id) as id FROM group_message GROUP BY group_id",
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
                console.log("group row:", row);
                var msgID = row.id;
                var p = this.getMessage(msgID);
                arr = arr.concat(p);
            }

            return Promise.all(arr);
        });
    }

    
    insertMessage(msg, successCB, errCB) {
        this.db.executeSql('INSERT INTO group_message (sender, group_id, timestamp, flags, content) VALUES (?, ?, ?, ?, ?)',
                           [msg.sender, msg.receiver, msg.timestamp, msg.flags, msg.content],
                           function(result) {
                               console.log("insert result:", result);
                               successCB(result.insertId);
                           },
                           function(error) {
                               console.log("insert error:", error);
                               errCB(err);
                           });
    }

    updateFlags(msgID, flags) {
        this.db.executeSql('UPDATE group_message SET flags= ? WHERE id=?',
                           [flags, msgID],
                           function(result) {
                               console.log("update flag result:", result);
                           },
                           function(error) {
                               console.log("update error:", error);
                           });        
    }

    //获取最近聊天记录
    getMessages(gid, successCB, errCB) {
        var sql = "SELECT id, sender, group_id, timestamp, flags, content FROM group_message  WHERE group_id = ? ORDER BY id DESC LIMIT ?";
        this.db.executeSql(sql, [gid, PAGE_SIZE],
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

    getEarlierMessages(gid, msgID, successCB, errCB) {
        var sql = "SELECT id, sender, group_id, timestamp, flags, content FROM group_message WHERE group_id = ? AND id < ? ORDER BY id DESC LIMIT ?";
        this.db.executeSql(sql, [gid, msgID, PAGE_SIZE],
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
