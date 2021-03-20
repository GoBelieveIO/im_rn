import React from 'react';
import {
    View,
    Image,
    StyleSheet,
} from 'react-native';

import moment from 'moment';
import PropTypes from 'prop-types';

import Avatar from './Avatar';
import Bubble from './Bubble';
import Day from './Day';


export default class Message extends React.Component {

    isSameDay(currentMessage = {}, diffMessage = {}) {
        let diff = 0;
        if (diffMessage.createdAt && currentMessage.createdAt) {
            diff = Math.abs(moment(diffMessage.createdAt).startOf('day').diff(moment(currentMessage.createdAt).startOf('day'), 'days'));
        } else {
            diff = 1;
        }
        if (diff === 0) {
            return true;
        }
        return false;
    }

    isSameUser(currentMessage = {}, diffMessage = {}) {
        if (diffMessage.user && currentMessage.user) {
            if (diffMessage.user._id === currentMessage.user._id) {
                return true;
            }
        }
        return false;
    }

    renderDay() {
        if (this.props.currentMessage.createdAt) {
            const {containerStyle, ...other} = this.props;
            const dayProps = {
                ...other,
                isSameUser: this.isSameUser,
                isSameDay: this.isSameDay,
            };
            if (this.props.renderDay) {
                return this.props.renderDay(dayProps);
            }
            return <Day {...dayProps}/>;
        }
        return null;
    }

    renderBubble() {
        const {containerStyle, ...other} = this.props;
        const bubbleProps = {
            ...other,
            isSameUser: this.isSameUser,
            isSameDay: this.isSameDay,
        };
        return <Bubble {...bubbleProps}/>;
    }

    renderAvatar() {
        if (this.props.user._id !== this.props.currentMessage.user._id) {
            const {containerStyle, ...other} = this.props;
            const avatarProps = {
                ...other,
                isSameUser: this.isSameUser,
                isSameDay: this.isSameDay,
            };

            return <Avatar {...avatarProps}/>;
        }
        return null;
    }

    render() {
        return (
            <View>
                {/* {this.renderDay()} */}
                <View style={[styles[this.props.position].container, {
                        marginBottom: this.isSameUser(this.props.currentMessage, this.props.nextMessage) ? 2 : 10,
                    }, this.props.containerStyle[this.props.position]]}>
                    {this.props.position === 'left' ? this.renderAvatar() : null}
                    {this.renderBubble()}
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
        },
    }),
    right: StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            marginLeft: 0,
            marginRight: 8,
        },
    }),
    center: StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        },
    }),
};

Message.defaultProps = {
    renderAvatar: null,
    renderBubble: null,
    renderDay: null,
    position: 'left',
    currentMessage: {},
    nextMessage: {},
    previousMessage: {},
    user: {},
    containerStyle: {},
};

Message.propTypes = {
    renderAvatar: PropTypes.func,
    renderBubble: PropTypes.func,
    renderDay: PropTypes.func,
    position: PropTypes.oneOf(['left', 'right', 'center']),
    currentMessage: PropTypes.object,
    nextMessage: PropTypes.object,
    previousMessage: PropTypes.object,
    user: PropTypes.object,
    // containerStyle: PropTypes.shape({
    //     left: View.propTypes.style,
    //     right: View.propTypes.style,
    // }),
};
