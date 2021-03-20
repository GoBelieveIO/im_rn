import React from 'react';
import {
    Clipboard,
    StyleSheet,
    TouchableWithoutFeedback,
    Image,
    View,
    Text,
} from 'react-native';

import PropTypes from 'prop-types'

import MessageText from './MessageText';
// import MessageImage from './MessageImage';
// import MessageAudio from './MessageAudio';
// import MessageLocation from './MessageLocation';
import Time from './Time';

import {MESSAGE_FLAG_FAILURE, MESSAGE_FLAG_LISTENED} from './IMessage';

export default class Bubble extends React.Component {
    constructor(props) {
        super(props);
        this.onLongPress = this.onLongPress.bind(this);
        this.onPress = this.onPress.bind(this);
    }

    handleBubbleToNext() {
        // if (this.props.isSameUser(this.props.currentMessage, this.props.nextMessage) && this.props.isSameDay(this.props.currentMessage, this.props.nextMessage)) {
        //     return StyleSheet.flatten([styles[this.props.position].containerToNext, this.props.containerToNextStyle[this.props.position]]);
        // }
        return null;
    }

    handleBubbleToPrevious() {
        // if (this.props.isSameUser(this.props.currentMessage, this.props.previousMessage) && this.props.isSameDay(this.props.currentMessage, this.props.previousMessage)) {
        //     return StyleSheet.flatten([styles[this.props.position].containerToPrevious, this.props.containerToPreviousStyle[this.props.position]]);
        // }
        return null;
    }

    renderMessageText() {
        if (this.props.currentMessage.text) {
            const {containerStyle, wrapperStyle, ...messageTextProps} = this.props;
            if (this.props.renderMessageText) {
                return this.props.renderMessageText(messageTextProps);
            }
            return <MessageText {...messageTextProps}/>;
        }
        return null;
    }

    renderMessageImage() {
        if (this.props.currentMessage.image) {
            const {containerStyle, wrapperStyle, ...messageImageProps} = this.props;
            if (this.props.renderMessageImage) {
                return this.props.renderMessageImage(messageImageProps);
            }
            return <MessageImage {...messageImageProps}/>;
        }
        return null;
    }

    renderMessageAudio() {
        if (this.props.currentMessage.audio) {
            console.log("render message auido");
            return <MessageAudio {...this.props}/>;
        }
    }

    renderMessageLocation() {
        if (this.props.currentMessage.location) {
            console.log("render message location");
            return <MessageLocation {...this.props}/>;
        }
    }
    
    renderTime() {
        if (this.props.currentMessage.createdAt) {
            const {containerStyle, wrapperStyle, ...timeProps} = this.props;
            if (this.props.renderTime) {
                return this.props.renderTime(timeProps);
            }
            return <Time {...timeProps}/>;
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

    //发送失败标志
    renderFlags() {
        var msg = this.props.currentMessage;
        if (this.props.user._id === this.props.currentMessage.user._id) {
            if (this.props.currentMessage.flags & MESSAGE_FLAG_FAILURE) {
                return (
                    <Image style={{alignSelf:"flex-end", width:20, height:20}}
                           source={require('./Images/MessageSendError.png')}>
                    </Image>
                );
            }
        }

        if (!msg.outgoing && msg.audio) {
            if (!(msg.flags & MESSAGE_FLAG_LISTENED)) {
                return (
                    <View style={{marginLeft:4, justifyContent:"space-between"}}>
                        
                        <View style={{backgroundColor:"red",
                                      width:8,
                                      height:8,
                                      borderRadius:90}}/>

                        <Text style={{color:"lightgrey"}}>
                            {"" + msg.audio.duration + "''"}
                        </Text>
                    </View>
                );
            } else {
                return (
                    <View style={{marginLeft:4, justifyContent:"flex-end"}}>
                        <Text style={{color:"lightgrey"}}>
                            {"" + msg.audio.duration + "''"}
                        </Text>
                    </View>
                );                
            }
        }

        if (msg.outgoing && msg.audio) {
            return (
                <View style={{marginRight:4, justifyContent:"flex-end"}}>
                    <Text style={{color:"lightgrey"}}>
                        {"" + msg.audio.duration + "''"}
                    </Text>
                </View>
            );                
        }
    }
    
    renderLeft() {
        return (
            <View style={[styles['left'].container, this.props.containerStyle['left']]}>

                <View style={[styles['left'].wrapper, this.props.wrapperStyle['left'], this.handleBubbleToNext(), this.handleBubbleToPrevious()]}>
                    <TouchableWithoutFeedback
                        onLongPress={this.onLongPress}
                        onPress={this.onPress}
                        {...this.props.touchableProps}
                    >
                        <View>
                            {this.renderMessageImage()}
                            {this.renderMessageText()}
                            {this.renderMessageAudio()}
                            {this.renderMessageLocation()}
                            {this.renderTime()}
                        </View>
                    </TouchableWithoutFeedback>
                </View>

                {this.renderFlags()}
            </View>
        );        
    }

    renderRight() {
        return (
            <View style={[styles['right'].container, this.props.containerStyle['right']]}>
                {this.renderFlags()}
                <View style={[styles['right'].wrapper, this.props.wrapperStyle['right'], this.handleBubbleToNext(), this.handleBubbleToPrevious()]}>
                    <TouchableWithoutFeedback
                        onLongPress={this.onLongPress}
                        onPress={this.onPress}
                        {...this.props.touchableProps}
                    >
                        <View>
                            {this.renderMessageImage()}
                            {this.renderMessageText()}
                            {this.renderMessageAudio()}
                            {this.renderMessageLocation()}
                            {this.renderTime()}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </View>
        );        
    }

    renderCenter() {
        var msg = this.props.currentMessage;
        return (
            <View style={{alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: 5,
                          marginBottom: 10, }}>
                <View >
                    <Text style={{backgroundColor: 'transparent',
                                  color: '#b2b2b2',
                                  fontSize: 12,
                                  fontWeight: '600',}}>
                        {msg.notification}
                    </Text>
                </View>
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
        container: {
            flex: 1,
            marginRight: 60,
            flexDirection:"row",
            justifyContent:"flex-start",
        },
        wrapper: {
            borderRadius: 15,
            backgroundColor: '#f0f0f0',
            minHeight: 20,
            justifyContent: 'flex-end',
        },
        containerToNext: {
            borderBottomLeftRadius: 3,
        },
        containerToPrevious: {
            borderTopLeftRadius: 3,
        },
    }),
    right: StyleSheet.create({
        container: {
            flex: 1,
            marginLeft: 60,
            flexDirection:"row",
            justifyContent:"flex-end",
        },
        wrapper: {
            borderRadius: 15,
            backgroundColor: '#0084ff',
            minHeight: 20,
            justifyContent: 'flex-end',
        },
        containerToNext: {
            borderBottomRightRadius: 3,
        },
        containerToPrevious: {
            borderTopRightRadius: 3,
        },
    }),
};

Bubble.contextTypes = {
    actionSheet: PropTypes.func,
};

Bubble.defaultProps = {
    touchableProps: {},
    onLongPress: null,
    renderMessageImage: null,
    renderMessageText: null,
    renderCustomView: null,
    renderTime: null,
    isSameUser: () => {},
    isSameDay: () => {},
    position: 'left',
    currentMessage: {
        text: null,
        createdAt: null,
        image: null,
    },
    nextMessage: {},
    previousMessage: {},
    containerStyle: {},
    wrapperStyle: {},
    containerToNextStyle: {},
    containerToPreviousStyle: {},
};

// Bubble.propTypes = {
//     touchableProps: PropTypes.object,
//     onLongPress: PropTypes.func,
//     renderMessageImage: PropTypes.func,
//     renderMessageText: PropTypes.func,
//     renderCustomView: PropTypes.func,
//     renderTime: PropTypes.func,
//     isSameUser: PropTypes.func,
//     isSameDay: PropTypes.func,
//     position: PropTypes.oneOf(['left', 'right', 'center']),
//     currentMessage: PropTypes.object,
//     nextMessage: PropTypes.object,
//     previousMessage: PropTypes.object,
//     containerStyle: PropTypes.shape({
//         left: View.propTypes.style,
//         right: View.propTypes.style,
//     }),
//     wrapperStyle: PropTypes.shape({
//         left: View.propTypes.style,
//         right: View.propTypes.style,
//     }),
//     containerToNextStyle: PropTypes.shape({
//         left: View.propTypes.style,
//         right: View.propTypes.style,
//     }),
//     containerToPreviousStyle: PropTypes.shape({
//         left: View.propTypes.style,
//         right: View.propTypes.style,
//     }),
// };
