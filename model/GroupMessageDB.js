var instance = null;
import {PAGE_SIZE} from "./IMessage";
import tokenizer from "./Tokenizer";

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
            this.db.executeSql("SELECT id, sender, group_id, timestamp, flags, content, attachment FROM group_message WHERE id= ?",
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

    
    insertMessage(msg) {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.db.executeSql('INSERT INTO group_message (sender, group_id, timestamp, flags, content) VALUES (?, ?, ?, ?, ?)',
                               [msg.sender, msg.receiver, msg.timestamp, msg.flags, msg.content],
                               function(result) {
                                   console.log("insert result:", result);
                                   resolve(result.insertId);
                               },
                               function(error) {
                                   console.log("insert error:", error);
                                   reject(err);
                               });
            
        }).then((rowid) => {
            if (msg.text) {
                var text = tokenizer(msg.text);
                return new Promise(function(resolve, reject) {
                    self.db.executeSql("INSERT INTO group_message_fts(docid, content) VALUES(?, ?)",
                                       [rowid, text],
                                       function(result) {
                                           resolve(rowid);
                                       },
                                       function(error) {
                                           reject(error);
                                       });
                });
            } else {
                return rowid;
            }
        });
    }

    updateAttachment(msgID, attachment) {
        this.db.executeSql('UPDATE group_message SET attachment= ? WHERE id=?',
                           [attachment, msgID],
                           function(result) {
                               console.log("update attachment result:", result);
                           },
                           function(error) {
                               console.log("update attachment error:", error);
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
        var sql = "SELECT id, sender, group_id, timestamp, flags, content, attachment FROM group_message  WHERE group_id = ? ORDER BY id DESC LIMIT ?";
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
        var sql = "SELECT id, sender, group_id, timestamp, flags, content, attachment FROM group_message WHERE group_id = ? AND id < ? ORDER BY id DESC LIMIT ?";
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

    search(key) {
        //manual escape, bind not working, why?
        key = key.replace("'","\'");
        var text = tokenizer(key);
        var sql = `SELECT rowid FROM group_message_fts WHERE group_message_fts MATCH '${text}'`;

        var self = this;
        return new Promise(function(resolve, reject) {
            self.db.executeSql(sql, [],
                               function(result) {
                                   var msgIDs = [];
                                   for (var i = 0; i < result.rows.length; i++) {
                                       var row = result.rows.item(i);
                                       msgIDs.push(row.rowid);
                                   }
                                   console.log("message ids:", msgIDs);
                                   resolve(msgIDs);
                               },
                               function(err) {
                                   console.log("search err:", err);
                                   reject(err);
                               });
        }).then((msgIDs)=> {
            return Promise.all(msgIDs.map((msgID) => {
                return self.getMessage(msgID);
            }));
        });
    }

}
