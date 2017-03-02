import React, { Component } from 'react';

import {
    Platform,
    Text,
    View,
    Image,
    ListView,
    TextInput,
    TouchableWithoutFeedback,
    TouchableHighlight
} from 'react-native';


import SearchBar from 'react-native-material-design-searchbar';
import PeerMessageDB from './chat/PeerMessageDB';
import GroupMessageDB from './chat/GroupMessageDB';

export default class Search extends Component {
    constructor(props) {
        super(props);

        const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
        this.state = {
            dataSource: ds.cloneWithRows([
              
            ])
        };

        this.searching = false;
        this.searchingText = "";
        this.searchText = "";
    }
    search(text) {
        console.log("begin search:", text);
        var peerDB = PeerMessageDB.getInstance();
        var groupDB = GroupMessageDB.getInstance();
        return Promise.all([peerDB.search(text), groupDB.search(text)])
               .then((results) => {
                   var convs1 = this.onPeerMessages(results[0]);
                   var convs2 = this.onGroupMessages(results[1]);
                   var convs = convs1.concat(convs2);
                   this.setState({
                       dataSource:this.state.dataSource.cloneWithRows(convs)
                   });
               });
    }
    
    onSearchChange(e) {
        if (typeof(e) == 'string' && e) {
            this.searchText = e;
            if (this.searching) {
                return;
            }
            this.searching = true;
            this.searchingText = e;
            this.search(e)
                .then(() => {
                    this.searching = false;
                    this.searchingText = "";
                    if (this.searchText != e) {
                        if (this.searchText) {
                            return this.search(this.searchText);
                        } else {
                            this.setState({
                                dataSource:this.state.dataSource.cloneWithRows([])
                            });
                        }
                    }
                });
        } else {
            this.searchText = "";
            this.setState({
                dataSource:this.state.dataSource.cloneWithRows([])
            });
        }
    }

    //搜索结果
    onGroupMessages(messages) {
        var convs = messages.map((message) => {
            var conv = {};
            var msgObj = JSON.parse(message.content);

            if (msgObj.text) {
                conv.text = msgObj.text;
            } else {
                conv.text = "";
            }
            conv.name = "g_" + message.group_id;
            conv.type = "group";
            return conv;
        });
        return convs;
    }
    onPeerMessages(messages) {
        var convs = messages.map((message) => {
            var conv = {};
            var msgObj = JSON.parse(message.content);

            if (msgObj.text) {
                conv.text = msgObj.text;
            } else {
                conv.text = "";
            }
            conv.name = "p_" + message.sender;
            conv.type = "peer";
            return conv;
        });
        return convs;
    }
    
    renderRow(conv) {
        var navigator = this.props.navigator;
        var self = this;
        function onPress() {
            console.log("row data:", conv);
           
        }
        return (
            <TouchableHighlight
                style={{flex:1, height:64, backgroundColor:"white"}}
                activeOpacity={0.6}
                underlayColor={"gray"}
                onPress={onPress}>
                <View style={{flex:1}}>
                    <View style={{flex:1,
                                  height:64,
                                  flexDirection:"row",
                                  alignItems:"center"}}>

                        <View style={{marginLeft:12, width:48, height:48}}>
                            <Image style={{ position:"absolute",
                                            left:0,
                                            top:8,
                                            width:40,
                                            height:40}}
                                   source={require("./Images/default.png")}/>
                        </View>
                        <View style={{flex:1,
                                      marginLeft:12,
                                      flexDirection:"row"}}>
                            <Text style={{fontWeight:"bold"}}>
                                {conv.name + "    " + conv.text}
                            </Text>
                        </View>
                    </View>
                    
                    <View style={{ height:1, backgroundColor:"gray"}}/>
                </View>
            </TouchableHighlight>
        );
    }
    
    render() {
        return (
            <View style={{flex:1}}>
                <SearchBar
                    onSearchChange={this.onSearchChange.bind(this)}
                    height={50}
                    onFocus={() => console.log('On Focus')}
                    onBlur={() => console.log('On Blur')}
                    placeholder={'Search...'}
                    autoCorrect={false}
                    padding={5}
                    returnKeyType={'search'}/>
                <ListView
                    enableEmptySections={true}
                    dataSource={this.state.dataSource}
                    renderRow={this.renderRow.bind(this)}
                />
            </View>
        );
    }
};
