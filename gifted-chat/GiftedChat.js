import React from 'react';
import {
    Animated,
    InteractionManager,
    Platform,
    StyleSheet,
    View,
    Text,
    Dimensions,
} from 'react-native';

import ActionSheet from '@exponent/react-native-action-sheet';
import dismissKeyboard from 'react-native-dismiss-keyboard';
import moment from 'moment/min/moment-with-locales.min';

import Actions from './Actions';
import Avatar from './Avatar';
import Bubble from './Bubble';
import MessageImage from './MessageImage';
import MessageText from './MessageText';
import Composer from './Composer';
import Day from './Day';
import InputToolbar from './InputToolbar';
import LoadEarlier from './LoadEarlier';
import Message from './Message';
import MessageContainer from './MessageContainer';
import Send from './Send';
import Time from './Time';

// Min and max heights of ToolbarInput and Composer
// Needed for Composer auto grow and ScrollView animation
// TODO move these values to Constants.js (also with used colors #b2b2b2)
const MIN_COMPOSER_HEIGHT = Platform.select({
    ios: 33,
    android: 41,
});
const MAX_COMPOSER_HEIGHT = 100;
const MIN_INPUT_TOOLBAR_HEIGHT = 44;//44

class GiftedChat extends React.Component {
    constructor(props) {
        super(props);

        // default values
        this._isMounted = false;
        this._keyboardHeight = 0;
        this._bottomOffset = 0;
        this._maxHeight = null;
        this._touchStarted = false;
        this._isFirstLayout = true;
        this._isTypingDisabled = false;
        this._locale = 'en';
        this._messages = [];

        this.state = {
            isInitialized: false, // initialization will calculate maxHeight before rendering the chat
            minInputToolbarHeight:MIN_INPUT_TOOLBAR_HEIGHT,
            recording: false,
            recordingText:"",
            recordingColor:"transparent",
        };


    }

    static append(currentMessages = [], messages) {
        if (!Array.isArray(messages)) {
            messages = [messages];
        }
        return messages.concat(currentMessages);
    }

    static prepend(currentMessages = [], messages) {
        if (!Array.isArray(messages)) {
            messages = [messages];
        }
        return currentMessages.concat(messages);
    }

    getChildContext() {
        return {
            actionSheet: () => this._actionSheetRef,
            getLocale: this.getLocale,
        };
    }

    componentWillMount() {
        this.setIsMounted(true);
        this.initLocale();
        this.initMessages(this.props.messages);
    }

    componentWillUnmount() {
        this.setIsMounted(false);
    }

    componentWillReceiveProps(nextProps = {}) {
        this.initMessages(nextProps.messages);
    }

    initLocale() {
        if (this.props.locale === null || moment.locales().indexOf(this.props.locale) === -1) {
            this.setLocale('en');
        } else {
            this.setLocale(this.props.locale);
        }
    }

    initMessages(messages = []) {
        this.setMessages(messages);
    }

    setLocale(locale) {
        this._locale = locale;
    }

    getLocale() {
        return this._locale;
    }

    setMessages(messages) {
        this._messages = messages;
    }

    getMessages() {
        return this._messages;
    }


    setKeyboardHeight(height) {
        this._keyboardHeight = height;
    }

    getKeyboardHeight() {
        return this._keyboardHeight;
    }

    setBottomOffset(value) {
        this._bottomOffset = value;
    }

    getBottomOffset() {
        return this._bottomOffset;
    }

    setIsFirstLayout(value) {
        this._isFirstLayout = value;
    }

    getIsFirstLayout() {
        return this._isFirstLayout;
    }

    setIsTypingDisabled(value) {
        this._isTypingDisabled = value;
    }

    getIsTypingDisabled() {
        return this._isTypingDisabled;
    }

    setIsMounted(value) {
        this._isMounted = value;
    }

    getIsMounted() {
        return this._isMounted;
    }

    prepareMessagesContainerHeight(value) {
        if (this.props.isAnimated === true) {
            return new Animated.Value(value);
        }
        return value;
    }

    onSend(messages = [], shouldResetInputToolbar = false) {
        if (!Array.isArray(messages)) {
            messages = [messages];
        }

        messages = messages.map((message) => {
            return {
                ...message,
                user: this.props.user,
                createdAt: new Date(),
                _id: 'temp-id-' + Math.round(Math.random() * 1000000),
            };
        });

        if (shouldResetInputToolbar === true) {
            this.setIsTypingDisabled(true);
            this.resetInputToolbar();
        }

        this.props.onSend(messages);
        this.scrollToBottom();

        if (shouldResetInputToolbar === true) {
            setTimeout(() => {
                if (this.getIsMounted() === true) {
                    this.setIsTypingDisabled(false);
                }
            }, 200);
        }
    }

    resetInputToolbar() {
        this.setState((previousState) => {
            return {
                text: '',
                composerHeight: MIN_COMPOSER_HEIGHT,
                messagesContainerHeight: this.prepareMessagesContainerHeight(this.getMaxHeight() - this.getMinInputToolbarHeight() - this.getKeyboardHeight() + this.getBottomOffset()),
            };
        });
    }

    calculateInputToolbarHeight(newComposerHeight) {
        return newComposerHeight + (this.getMinInputToolbarHeight() - MIN_COMPOSER_HEIGHT);
    }



    renderChatFooter() {
        if (this.props.renderChatFooter) {
            const footerProps = {
                ...this.props,
            };
            return this.props.renderChatFooter(footerProps);
        }
        return null;
    }

    renderLoading() {
        if (this.props.renderLoading) {
            return this.props.renderLoading();
        }
        return null;
    }


}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

GiftedChat.childContextTypes = {
    actionSheet: React.PropTypes.func,
    getLocale: React.PropTypes.func,
};

GiftedChat.defaultProps = {
    messages: [],
    onSend: () => {
    },
    loadEarlier: false,
    onLoadEarlier: () => {
    },
    locale: null,
    isAnimated: Platform.select({
        ios: true,
        android: false,
    }),
    renderAccessory: null,
    renderActions: null,
    renderAvatar: null,
    renderBubble: null,
    renderFooter: null,
    renderChatFooter: null,
    renderMessageText: null,
    renderMessageImage: null,
    renderComposer: null,
    renderCustomView: null,
    renderDay: null,
    renderInputToolbar: null,
    renderLoadEarlier: null,
    renderLoading: null,
    renderMessage: null,
    renderSend: null,
    renderTime: null,
    user: {},
    bottomOffset: 0,
    isLoadingEarlier: false,
};

GiftedChat.propTypes = {
    messages: React.PropTypes.array,
    onSend: React.PropTypes.func,
    loadEarlier: React.PropTypes.bool,
    onLoadEarlier: React.PropTypes.func,
    locale: React.PropTypes.string,
    isAnimated: React.PropTypes.bool,
    renderAccessory: React.PropTypes.func,
    renderActions: React.PropTypes.func,
    renderAvatar: React.PropTypes.func,
    renderBubble: React.PropTypes.func,
    renderFooter: React.PropTypes.func,
    renderChatFooter: React.PropTypes.func,
    renderMessageText: React.PropTypes.func,
    renderMessageImage: React.PropTypes.func,
    renderComposer: React.PropTypes.func,
    renderCustomView: React.PropTypes.func,
    renderDay: React.PropTypes.func,
    renderInputToolbar: React.PropTypes.func,
    renderLoadEarlier: React.PropTypes.func,
    renderLoading: React.PropTypes.func,
    renderMessage: React.PropTypes.func,
    renderSend: React.PropTypes.func,
    renderTime: React.PropTypes.func,
    user: React.PropTypes.object,
    bottomOffset: React.PropTypes.number,
    isLoadingEarlier: React.PropTypes.bool,
};

export {
    GiftedChat,
    Actions,
    Avatar,
    Bubble,
    MessageImage,
    MessageText,
    Composer,
    Day,
    InputToolbar,
    LoadEarlier,
    Message,
    Send,
    Time,
};
