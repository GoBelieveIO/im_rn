import React from 'react';
import {
    StyleSheet,
    TouchableWithoutFeedback,
    View,
    Text,
} from 'react-native';

import MessageText from './MessageText';
import MessageImage from './MessageImage';
import MessageAudio from './MessageAudio';
import MessageLocation from './MessageLocation';
import Time from './Time';
import {Message as IMessage} from "../model/IMessage";

interface Props {
    onMessagePress:any;
    onMessageLongPress:any;
    currentMessage:IMessage;
    position:any;
}

export default class Bubble extends React.Component<Props, {}> {
    constructor(props) {
        super(props);
        this.onLongPress = this.onLongPress.bind(this);
        this.onPress = this.onPress.bind(this);
    }

    renderMessage() {
        if (this.props.currentMessage.contentObj.text) {
            return this.renderMessageText();
        } else if (this.props.currentMessage.contentObj.image2) {
            return this.renderMessageImage();
        } else if (this.props.currentMessage.contentObj.audio) {
            return this.renderMessageAudio();
        } else if (this.props.currentMessage.contentObj.location) {
            return this.renderMessageLocation();
        }
    }

    renderMessageText() {
        if (this.props.currentMessage.contentObj.text) {
            return <MessageText position={this.props.position} currentMessage={this.props.currentMessage}/>;
        }
        return null;
    }

    renderMessageImage() {
        if (this.props.currentMessage.contentObj.image2) {
            return <MessageImage currentMessage={this.props.currentMessage}/>;
        }
        return null;
    }

    renderMessageAudio() {
        if (this.props.currentMessage.contentObj.audio) {
            console.log("render message auido");
            return <MessageAudio currentMessage={this.props.currentMessage}/>;
        }
    }

    renderMessageLocation() {
        if (this.props.currentMessage.contentObj.location) {
            console.log("render message location");
            return <MessageLocation currentMessage={this.props.currentMessage}/>;
        }
    }
    
    renderTime() {
        if (this.props.currentMessage.timestamp) {
            return <Time position={this.props.position} currentMessage={this.props.currentMessage}/>;
        }
        return null;
    }


    onLongPress() {
        if (this.props.onMessageLongPress) {
            this.props.onMessageLongPress(this.props.currentMessage);
        }
    }

    onPress() {
        if (this.props.onMessagePress) {
            this.props.onMessagePress(this.props.currentMessage);
        }
    }
    
    renderLeft() {
        return (
            <View style={[styles['left'].wrapper]}>
                <TouchableWithoutFeedback
                    onLongPress={this.onLongPress}
                    onPress={this.onPress}>
                    <View>
                        {this.renderMessage()}
                        {this.renderTime()}
                    </View>
                </TouchableWithoutFeedback>
            </View>
        );        
    }

    renderRight() {
        return (
            <View style={[styles['right'].wrapper]}>
                <TouchableWithoutFeedback
                    onLongPress={this.onLongPress}
                    onPress={this.onPress}>
                    <View>
                        {this.renderMessageImage()}
                        {this.renderMessageText()}
                        {this.renderMessageAudio()}
                        {this.renderMessageLocation()}
                        {this.renderTime()}
                    </View>
                </TouchableWithoutFeedback>
            </View>
        );        
    }

    renderCenter() {
        var msg = this.props.currentMessage;
        return (
            <View >
                <Text style={[styles['center'].wrapper]}>
                    {msg.contentObj.notification}
                </Text>
            </View>
        );
    }
    
    render() {
        if (this.props.position == 'left') {
            return this.renderLeft();
        } else if (this.props.position == 'right') {
            return this.renderRight();
        } else if (this.props.position == 'center') {
            return this.renderCenter();
        } else {
            return null;
        }
    }
}

const styles = {
    left: StyleSheet.create({
        wrapper: {
            borderRadius: 15,
            backgroundColor: '#f0f0f0',
            minHeight: 20,
            justifyContent: 'flex-end',
        },

    }),
    right: StyleSheet.create({
        wrapper: {
            borderRadius: 15,
            backgroundColor: '#0084ff',
            minHeight: 20,
            justifyContent: 'flex-end',
        },

    }),

    center: StyleSheet.create({
        wrapper: {
            backgroundColor: 'transparent',
            color: '#b2b2b2',
            fontSize: 12,
            fontWeight: '600'
        },

    }),
};

// Bubble.contextTypes = {
//     actionSheet: PropTypes.func,
// };
