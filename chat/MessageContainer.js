import React from 'react';

import {
    FlatList,
    View,
} from 'react-native';
import PropTypes from 'prop-types';
import Message from './Message';

export default class MessageContainer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
        this.renderRow = this.renderRow.bind(this);

    }


    componentDidUpdate(prevProps, prevState) {

    }

    scrollTo(options) {
        // this._invertibleScrollViewRef.scrollTo(options);
    }

    scrollToBottom(options) {
        this.listRef.scrollToEnd({animated:true});
    }

    renderRow(row) {
        var message = row.item;
        if (!message._id && message._id !== 0) {
            console.warn('GiftedChat: `_id` is missing for message', JSON.stringify(message));
        }
        if (!message.user) {
            console.warn('GiftedChat: `user` is missing for message', JSON.stringify(message));
            message.user = {};
        }

        var position;
        if (message.notification) {
            position = "center";
        } else {
            position = message.user._id === this.props.user._id ? 'right' : 'left';
        }
        
        const messageProps = {
            ...this.props,
            key: message._id,
            currentMessage: message,
            previousMessage: message.previousMessage,
            nextMessage: message.nextMessage,
            position: position,
        };

        if (this.props.renderMessage) {
            return this.props.renderMessage(messageProps);
        }
        return <Message {...messageProps}/>;
    }


    render() {
        return (
            <View ref='container' style={{flex:1}}>
                <FlatList
                        ref={(ref) => {this.listRef=ref}}
                        enableEmptySections={true}
                        keyboardShouldPersistTaps="always"
                        automaticallyAdjustContentInsets={false}
                        initialListSize={20}
                        pageSize={20}
                        inverted={false}
                        data={this.props.messages}
                        renderItem={this.renderRow}
                        keyExtractor={(item, index) => {return "" + item._id}}
                        refreshing={this.props.isLoading}
                        onRefresh={() => {
                            this.props.onLoadMoreAsync();
                        }}
                    />
            </View>
        );
    }
}

MessageContainer.defaultProps = {
    messages: [],
    user: {},
    renderMessage: null,
};

MessageContainer.propTypes = {
    messages: PropTypes.array,
    user: PropTypes.object,
    renderMessage: PropTypes.func,
};
