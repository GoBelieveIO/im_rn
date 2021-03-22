import React from 'react';
import {
    View,
    Image,
    StyleSheet,
    Text
} from 'react-native';

import Bubble from './Bubble';
import GiftedAvatar from './GiftedAvatar';
import {MESSAGE_FLAG_FAILURE, MESSAGE_FLAG_LISTENED, Message as IMessage} from '../model/IMessage';


interface Props {
    position:any;
    currentMessage:IMessage;
    user:any;
    onMessagePress:any;
    onMessageLongPress:any;
}

export default class Message extends React.Component<Props, {}> {
    renderBubble() {
        return <Bubble 
                currentMessage={this.props.currentMessage} 
                position={this.props.position} 
                onMessagePress={this.props.onMessagePress}
                onMessageLongPress={this.props.onMessageLongPress}/>;
    }

    //发送失败标志
    renderFlags() {
        var msg = this.props.currentMessage;
        if (this.props.user._id === this.props.currentMessage.sender) {
            if (this.props.currentMessage.flags & MESSAGE_FLAG_FAILURE) {
                return (
                    <Image style={{alignSelf:"flex-end", width:20, height:20}}
                            source={require('./Images/MessageSendError.png')}>
                    </Image>
                );
            }
        }

        if (!msg.isOutgoing && msg.contentObj.audio) {
            if (!(msg.flags & MESSAGE_FLAG_LISTENED)) {
                return (
                    <View style={{marginLeft:4, justifyContent:"space-between"}}>
                        
                        <View style={{backgroundColor:"red",
                                        width:8,
                                        height:8,
                                        borderRadius:90}}/>

                        <Text style={{color:"lightgrey"}}>
                            {"" + msg.contentObj.audio.duration + "''"}
                        </Text>
                    </View>
                );
            } else {
                return (
                    <View style={{marginLeft:4, justifyContent:"flex-end"}}>
                        <Text style={{color:"lightgrey"}}>
                            {"" + msg.contentObj.audio.duration + "''"}
                        </Text>
                    </View>
                );                
            }
        }

        if (msg.isOutgoing && msg.contentObj.audio) {
            return (
                <View style={{marginRight:4, justifyContent:"flex-end"}}>
                    <Text style={{color:"lightgrey"}}>
                        {"" + msg.contentObj.audio.duration + "''"}
                    </Text>
                </View>
            );                
        }
    }

    renderAvatar() {
        return (
            <View style={styles[this.props.position].avatar}>
                <GiftedAvatar
                    avatarStyle={StyleSheet.flatten([styles[this.props.position].image])}
                    user={{_id:this.props.currentMessage.sender}}
                />
            </View>
        );
    }

    render() {
        return (
            <View>
                <View style={styles[this.props.position].container}>
                    {this.props.position === 'left' ? this.renderAvatar() : null}

                    <View style={styles[this.props.position].bubble}>
                        {this.props.position === 'right' ? this.renderFlags() : null}
                        {this.renderBubble()}
                        {this.props.position === 'left' ? this.renderFlags() : null}
                    </View>
           
                    {this.props.position === 'right' ? this.renderAvatar() : null}
                </View>
            </View>
        );
    }
}

const styles = {
    left: StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'flex-start',
            marginLeft: 8,
            marginRight: 0,
            marginBottom: 4,
        },

        bubble: {
            flex: 1,
            marginRight: 60,
            flexDirection:"row",
            justifyContent:"flex-start",
        },

        avatar: {
            marginRight: 8,
        },
        image: {
            height: 36,
            width: 36,
            borderRadius: 18,
        },
    }),

    right: StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            marginLeft: 0,
            marginRight: 8,
            marginBottom: 4,
        },

        bubble: {
            flex: 1,
            marginLeft: 60,
            flexDirection:"row",
            justifyContent:"flex-end",
        },

        avatar: {
            marginLeft: 8,
        },
        image: {
            height: 36,
            width: 36,
            borderRadius: 18,
          },
    }),

    center: StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 4,
        },


        bubble: {
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 5,
            marginBottom: 10,
        },
    }),
};


