import React from 'react';
import {
    Platform,
    Text,
    View,
    Image,
    ListView,
    TouchableWithoutFeedback,
    TouchableHighlight
} from 'react-native';

import {connect} from 'react-redux'
import RCTDeviceEventEmitter from 'RCTDeviceEventEmitter';


import {setConversations, setUnread} from './actions'

var IMService = require("./im");

import PeerMessageDB from './PeerMessageDB.js';

class Conversation extends React.Component {
    constructor(props) {
        super(props);

        const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
        this.state = {
            dataSource: ds.cloneWithRows([
            ])
        };
    }

    
    componentWillMount() {
        var db = PeerMessageDB.getInstance();
        
        db.getConversations()
          .then((messages) => {
              var convs = [];
              for (var i in messages) {
                  var m = messages[i];
                  console.log("m:", m, "uid:", this.props.uid);
                  var cid = (m.sender == this.props.uid) ? m.receiver : m.sender;
                  var conv = {
                      id:cid,
                      cid:cid,
                      name:"" + cid,
                      timestamp:m.timestamp,
                      unread:0,
                      message:m,
                  }
                  var msgObj = JSON.parse(m.content);
                  if (msgObj.text) {
                      conv.content = msgObj.text;
                  } else if (msgObj.image2) {
                      conv.content = "一张图片";
                  } else if (msgObj.audio) {
                      conv.content = "语音"
                  } else if (msgObj.location) {
                      conv.content = "位置";
                  } else {
                      conv.content = "";
                  }
                  
                  convs = convs.concat(conv);
              }

              console.log("conversations:", convs);
              this.props.dispatch(setConversations(convs));
          });

    }
    
    componentWillReceiveProps(nextProps) {
        if (this.props.conversations === nextProps.conversations) {
            return;
        }
        this.setState({
            dataSource: this.state.dataSource.cloneWithRows(nextProps.conversations)
        });
    }
    
    renderRow(conv) {
        var navigator = this.props.navigator;
        var self = this;
        function onPress() {
            console.log("row data:", conv);

            navigator.push({
                title:"Chat",
                screen:"demo.PeerChat",
                passProps:{
                    sender:self.props.uid,
                    receiver:conv.cid,
                    token:self.props.token,
                },
            });
        }
        
        return (
            <TouchableHighlight
                style={{flex:1, height:40}}
                onPress={onPress}>
                <View style={{flex:1, height:40, justifyContent:"center"}}>
                    <Text style={{marginLeft:12}}>
                        {conv.name}
                    </Text>
                    <Text style={{marginLeft:12}}>
                        {conv.content}
                    </Text>

                    <View style={{height:1, marginTop:4, backgroundColor:"gray"}}/>
                </View>
            </TouchableHighlight>
        );
    }

    
    render() {
        return (
            <View style={{flex: 1, paddingTop: 22}}>
                <ListView
                    enableEmptySections={true}
                    dataSource={this.state.dataSource}
                    renderRow={this.renderRow.bind(this)}
                />
            </View>
        );        
    }

    
}

Conversation = connect(function(state){
    return {
        conversations:state.conversations,
    };
})(Conversation);

export default Conversation;
