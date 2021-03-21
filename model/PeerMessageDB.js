var instance = null;

import {PAGE_SIZE} from "./IMessage";
import tokenizer from "./Tokenizer";

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
    
    insertMessage(msg, uid) {
        console.log("uid:", uid);
        var self = this;
        var p = new Promise(function(resolve, reject) {
            self.db.executeSql('INSERT INTO peer_message (peer, sender, receiver, timestamp, flags, content) VALUES (?, ?, ?, ?, ?, ?)',
                               [uid, msg.sender, msg.receiver, msg.timestamp, msg.flags, msg.content],
                               function(result) {
                                   console.log("insert result:", result);
                                   resolve(result.insertId);
                               },
                               function(error) {
                                   reject(error);
                               });
        })
        p.then((rowid) => {
            if (msg.text) {
                var text = tokenizer(msg.text);
                return new Promise(function(resolve, reject) {
                    self.db.executeSql("INSERT INTO peer_message_fts(docid, content) VALUES(?, ?)",
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
        return p;
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
         
                               var msgs = [];
                               for (var i = 0; i < result.rows.length; i++) {
                                   var row = result.rows.item(i);
                                   //console.log("row:", row);
                                   msgs.push(row);
                               }
                               console.log("get messages:", msgs.length);
                               successCB(msgs);
                           },
                           function(e) {
                               errCB(e);
                           });
    }

    getEarlierMessages(uid, msgID, successCB, errCB) {
        var sql = "SELECT id, sender, receiver, timestamp, flags, content, attachment FROM peer_message WHERE peer = ? AND id < ? ORDER BY id DESC LIMIT ?";
        this.db.executeSql(sql, [uid, msgID, PAGE_SIZE],
                           function(result) {
                               //console.log("get messages:", result);
                               var msgs = [];
                               for (var i = 0; i < result.rows.length; i++) {
                                   var row = result.rows.item(i);
                                   //console.log("row:", row);
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
        var sql = `SELECT rowid FROM peer_message_fts WHERE peer_message_fts MATCH '${text}'`;

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
