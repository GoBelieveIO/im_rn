import React from 'react';
import {
    StyleSheet,
    TouchableWithoutFeedback,
    Image,
    View,
    Text,
} from 'react-native';

import PropTypes from 'prop-types'

import MessageText from './MessageText';
import MessageImage from './MessageImage';
import MessageAudio from './MessageAudio';
import MessageLocation from './MessageLocation';
import Time from './Time';


export default class Bubble extends React.Component {
    constructor(props) {
        super(props);
        this.onLongPress = this.onLongPress.bind(this);
        this.onPress = this.onPress.bind(this);
    }

    renderMessageText() {
        if (this.props.currentMessage.text) {
            const {containerStyle, wrapperStyle, ...messageTextProps} = this.props;
            return <MessageText {...messageTextProps}/>;
        }
        return null;
    }

    renderMessageImage() {
        if (this.props.currentMessage.image) {
            const {containerStyle, wrapperStyle, ...messageImageProps} = this.props;
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
    
    renderLeft() {
        return (
            <View style={[styles['left'].wrapper]}>
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
                    {msg.notification}
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
