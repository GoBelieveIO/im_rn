import React from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    View,
    Dimensions,
    TextInput,
    Image,
    ActivityIndicator,
    Keyboard,
    LayoutAnimation,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Animated
} from 'react-native';

import {GiftedChat, Actions, Bubble} from './gifted-chat';
import CustomActions from './CustomActions';
import CustomView from './CustomView';
import ImagePicker from 'react-native-image-picker'
import Emoji from 'react-native-emoji'
import Swiper from 'react-native-swiper'
import Styles from './Styles/MessageScreenStyle'
import {Images, Colors, Metrics} from './Themes'

var spliddit = require('spliddit');
var emoji = require("./emoji");
var IMService = require("./im");

const {width, height} = Dimensions.get('window')


const options = {
    title: 'Select Avatar',
    customButtons: [
        {name: 'fb', title: 'Choose Photo from Facebook'},
    ],
    storageOptions: {
        skipBackup: true,
        path: 'images'
    }
}


export default class PeerChat extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            messages: [],
            loadEarlier: true,
            typingText: null,
            isLoadingEarlier: false,
            actionVisible: false,
            
            height: 34,
            isRefreshing: false,
            modalVisible: false,
            focused: false,
            visibleHeight: Metrics.screenHeight,
            isEmoji: false,
            value: '',
        };

        this._isMounted = false;
        this.renderBubble = this.renderBubble.bind(this);
        this.onLoadEarlier = this.onLoadEarlier.bind(this);
        this.renderInputToolbar = this.renderInputToolbar.bind(this);
        
        this._isAlright = null;
    }

    componentWillMount() {
        var im = IMService.instance;
        im.addObserver(this);
        this._isMounted = true;
        this.setState(() => {
            return {
                messages: []
            };
        });
    }

    componentWillUnmount() {
        var im = IMService.instance;
        im.removeObserver(this);
        this._isMounted = false;
    }

    onLoadEarlier() {
        this.setState((previousState) => {
            return {
                isLoadingEarlier: true,
            };
        });

        setTimeout(() => {
            if (this._isMounted === true) {
                this.setState((previousState) => {
                    return {
                        messages: GiftedChat.prepend(previousState.messages, []),
                        loadEarlier: false,
                        isLoadingEarlier: false,
                    };
                });
            }
        }, 1000); // simulating network
    }

    sendTextMessage(text) {
        var obj = {"text": text};
        var textMsg = JSON.stringify(obj);
        var sender = this.props.sender;
        var receiver = this.props.receiver;
        var message = {sender:sender, receiver:receiver, content: textMsg, msgLocalID:1};
        var im = IMService.instance
        if (im.connectState == IMService.STATE_CONNECTED) {
            im.sendPeerMessage(message);
        }
    }

    sendImageMessage(image) {
        /*example:
         { fileSize: 185223,
        origURL: 'assets-library://asset/asset.JPG?id=99D53A1F-FEEF-40E1-8BB3-7DD55A43C8B7&ext=JPG',
        longitude: -14.538611666666666,
        fileName: 'IMG_0004.JPG',
        data: '/9j/4AAQSkZJRgABAQAASAB',
        width: 1668,
        height: 2500,
        latitude: 64.752895,
        timestamp: '2012-08-08T21:29:49Z',
        uri: 'file:///Users/houxh/Library/Developer/CoreSimulator/Devices/5E9048B4-F283-41C2-A57F-518B9A987EC1/data/Containers/Data/Application/A20D6751-7004-4CEF-8CE7-B4708431CAD1/Documents/images/71CC88A8-3699-4116-B44F-AD0313A8165E.jpg',
           isVertical: true }*/
    }


    handlePeerMessage(msg) {
        if (msg.sender != this.props.sender && 
            msg.sender != this.props.receiver) {
            return;
        }

        var msgObj = JSON.parse(msg.content);
        console.log("handle peer message:", msg, msgObj);

        var text = msgObj.text;
        this.setState((previousState) => {
            return {
                messages: GiftedChat.append(previousState.messages, {
                    _id: Math.round(Math.random() * 1000000),
                    text: text,
                    createdAt: new Date(),
                    user: {
                        _id: msg.sender,
                        name: '哈哈',
                        //avatar: 'https://facebook.github.io/react/img/logo_og.png',
                    },
                }),
            };
        });
    }

    handleMessageACK() {
        console.log("handle message ack");
    }


    renderBubble(props) {
        return (
            <Bubble
                {...props}
                wrapperStyle={{
                    left: {
                        backgroundColor: '#f0f0f0',
                    }
                }}
            />
        );
    }

    renderCustomView(props) {
        return (
            <CustomView
                {...props}
            />
        );
    }

    
    handleFocusSearch() {
        this.setState({
            isEmoji: false,
            actionVisible: false,
            focused: true,
        })
        this.giftedChat.setMinInputToolbarHeight(44);
    }

    handleBlurSearch() {
        this.setState({focused: false})
    }

    handleSend() {
        if (!this.state.value || !this.state.value.trim()) return
        var text = this.state.value.trim();
        this.sendTextMessage(text);
        this.setState({
            value: '',
            height: 34
        });


        var message = {
            _id: Math.round(Math.random() * 1000000),
            text: text,
            createdAt: new Date(),
            user: {
                _id: this.props.sender,
                name: '哈哈',
                //avatar: 'https://facebook.github.io/react/img/logo_og.png',
            },
        };

        this.setState((previousState) => {
            return {
                value: '',
                messages: GiftedChat.append(previousState.messages, message),
            };
        });
    }

    handleChangeText(v) {
        console.log("text changed:", v);
        this.setState({
            value: v,
        });
    }

    handleImagePicker() {
        var isEmoji = this.state.isEmoji;
        this.setState({
            isEmoji: false,
            actionVisible: false
        });

        if (isEmoji) {
            //emoji state changed
            this.giftedChat.setMinInputToolbarHeight(44);
        }

        
        ImagePicker.launchImageLibrary(options, (response) => {
            console.log('Response = ', response);

            if (response.didCancel) {
                console.log('User cancelled image picker');
            }
            else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            }
            else if (response.customButton) {
                console.log('User tapped custom button: ', response.customButton);
            }
            else {
                // You can display the image using either data...
                //const source = {uri: 'data:image/jpeg;base64,' + response.data, isStatic: true};

                // or a reference to the platform specific asset location
                let source = null;
                if (Platform.OS === 'ios') {
                    source = {uri: response.uri.replace('file://', ''), isStatic: true};
                } else {
                    source = {uri: response.uri, isStatic: true};
                }
                console.log("image picker response:", response);         
                this.sendImageMessage(response)
            }
        });
    }

    handleCameraPicker() {
        var isEmoji = this.state.isEmoji;
        this.setState({
            isEmoji: false,
            actionVisible: false
        });
        if (isEmoji) {
            //emoji state changed
            this.giftedChat.setMinInputToolbarHeight(44);
        }

        // Launch Camera:
        ImagePicker.launchCamera(options, (response) => {
            console.log('Response = ', response);

            if (response.didCancel) {
                console.log('User cancelled image picker');
            }
            else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            }
            else if (response.customButton) {
                console.log('User tapped custom button: ', response.customButton);
            }
            else {
                // You can display the image using either data...
                //const source = {uri: 'data:image/jpeg;base64,' + response.data, isStatic: true};

                // or a reference to the platform specific asset location
                let source = null;
                if (Platform.OS === 'ios') {
                    source = {uri: response.uri.replace('file://', ''), isStatic: true};
                } else {
                    source = {uri: response.uri, isStatic: true};
                }

                console.log("camera picker response:", response);
                this.sendImageMessage(response);
            }
        });
    }

    handleLocationClick() {
        console.log("locaiton click");
    }

    handleEmojiOpen() {
        var isEmoji = this.state.isEmoji;
        isEmoji = !isEmoji;
        this.setState({
            isEmoji: isEmoji,
            actionVisible: false
        })

        if (isEmoji) {
            this.search.blur();
            this.giftedChat.setMinInputToolbarHeight(44 + 128);
        } else {
            this.giftedChat.setMinInputToolbarHeight(44);
        }
    }

    handleEmojiClick(v) {
        var newValue = (this.value || '') + v;
        this.setState({
            value: newValue
        });
        this.value = newValue;
    }
    
    handleEmojiCancel() {
        if (!this.state.value) return

        const arr = spliddit(this.state.value);
        const len = arr.length
        let newValue = ''

        console.log("value length:", len, this.state.value.length);
        arr.pop();
        newValue = arr.join('');

        console.log("new value:", newValue);
        this.setState({
            value: newValue
        })
        this.value = newValue;
    }

    onActionsPress() {
        console.log("on action press");
        var actionVisible = this.state.actionVisible;
        if (actionVisible) {
            return;
        }

        actionVisible = !actionVisible;
        this.setState({actionVisible:actionVisible, isEmoji:false});
        if (actionVisible) {
            this.giftedChat.setMinInputToolbarHeight(44+44);
        }
    }
    
    _renderSendButton() {
        const {isEmoji, focused} = this.state

        return (focused || isEmoji) ? (
            <View style={{flexDirection:"row", justifyContent:"center", alignItems:"center"}}>
                <TouchableOpacity style={{padding:5, justifyContent:"center"}} onPress={this.handleEmojiOpen.bind(this)}>
                    {
                        isEmoji ? <Image source={Images.iconEmojiActive}/> : <Image source={Images.iconEmoji}/>
                    }
                </TouchableOpacity>
                
                <TouchableOpacity style={{justifyContent:"center"}}
                                  onPress={this.handleSend.bind(this)}>
                    <Text style={Styles.sendText}>{'send'}</Text>
                </TouchableOpacity>
            </View>
        ) : (
            <View style={{flexDirection:"row", justifyContent:"center", alignItems:"center"}}>
                <TouchableOpacity style={{padding:5, justifyContent:"center"}} onPress={this.handleEmojiOpen.bind(this)}>
                    {
                        isEmoji ? <Image source={Images.iconEmojiActive}/> : <Image source={Images.iconEmoji}/>
                    }
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={{justifyContent:"center"}}
                    onPress={this.onActionsPress.bind(this)}>
                    <View
                        style={{  borderRadius: 13,
                                  borderColor: '#b2b2b2',
                                  borderWidth: 2,
                                  width:26,
                                  height:26,                                   
                                  justifyContent:"center"}}>
                        <Text style={{  color: '#b2b2b2',
                                        fontWeight: 'bold',
                                        fontSize: 16,
                                                                             
                                        backgroundColor: 'transparent',
                                        textAlign: 'center'}}>
                            +
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        );
    }

    _renderEmoji() {
        const {isEmoji, focused} = this.state
        const emojiStyle = []
        const rowIconNum = 7
        const rowNum = 3
        const emojis = Object.keys(emoji.map).map((v, k) => {
            const name = emoji.map[v]
            return (
                <TouchableOpacity key={v + k} onPress={() => {
                        this.handleEmojiClick(v)
                    }}>
                    <Text style={[Styles.emoji, emojiStyle]}><Emoji name={name}/></Text>
                </TouchableOpacity>
            )
        })
        return isEmoji ? (
            <View style={Styles.emojiRow}>
                <Swiper style={Styles.wrapper} loop={false}
                        height={125}
                        dotStyle={ {bottom: -30} }
                        activeDotStyle={ {bottom: -30} }
                >
                    <View style={Styles.slide}>
                        <View style={Styles.slideRow}>
                            {emojis.slice(0, rowIconNum)}
                        </View>
                        <View style={Styles.slideRow}>
                            {emojis.slice(1 * rowIconNum, rowIconNum * 2)}
                        </View>
                        <View style={Styles.slideRow}>
                            {emojis.slice(2 * rowIconNum, rowIconNum * 3 - 1)}
                            <TouchableOpacity onPress={this.handleEmojiCancel.bind(this)}>
                                <Text style={[Styles.emoji, emojiStyle]}><Emoji name="arrow_left"/></Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={Styles.slide}>
                        <View style={Styles.slideRow}>
                            {emojis.slice(3 * rowIconNum - 1, rowIconNum * 4 - 1)}
                        </View>
                        <View style={Styles.slideRow}>
                            {emojis.slice(4 * rowIconNum - 1, rowIconNum * 5 - 1)}
                        </View>
                        <View style={Styles.slideRow}>
                            {emojis.slice(5 * rowIconNum - 1, rowIconNum * 6 - 1)}
                            <TouchableOpacity onPress={this.handleEmojiCancel.bind(this)}>
                                <Text style={[Styles.emoji, emojiStyle]}><Emoji name="arrow_left"/></Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Swiper>
            </View>
        ) : null
    }
    
    _renderActions() {
        const {isEmoji, focused} = this.state
        return (
            <View style={Styles.iconRow}>
                <TouchableOpacity style={Styles.iconTouch} onPress={this.handleCameraPicker.bind(this)}>
                    <Image source={Images.iconCamera}/>
                </TouchableOpacity>
                <TouchableOpacity style={Styles.iconTouch} onPress={this.handleImagePicker.bind(this)}>
                    <Image source={Images.iconImage}/>
                </TouchableOpacity>
                <TouchableOpacity style={Styles.iconTouch} onPress={this.handleLocationClick.bind(this)}>
                    <Image source={Images.iconEmoji}/>
                </TouchableOpacity>
            </View>
        );
    }

    renderInputToolbar(inputToolbarProps) {
        
        const {value = '', isEmoji} = this.state

        var height = inputToolbarProps.composerHeight + 11;
        console.log("composer height:", inputToolbarProps.composerHeight);
        return (
            <View style={Styles.search}>
                <View style={[Styles.inputRow, {height:height}]}>
                    <View style={Styles.searchRow}>
                        <TextInput
                            ref={(search)=> {this.search = search} }
                            style={[Styles.searchInput, {height: inputToolbarProps.composerHeight}]}
                            value={value}
                            autoFocus={this.state.focused}
                            editable={true}
                            keyboardType='default'
                            returnKeyType='default'
                            autoCapitalize='none'
                            autoCorrect={false}
                            multiline={true}
                            onChange={inputToolbarProps.onChange}
                            onFocus={this.handleFocusSearch.bind(this)}
                            onBlur={this.handleBlurSearch.bind(this)}
                            onChangeText={this.handleChangeText.bind(this)}
                            onEndEditing={() => {
                                }}
                            onLayout={() => {
                                }}
                            underlineColorAndroid='transparent'
                            onSubmitEditing={() => this.search.focus()}
                            placeholder={'sendMessage'}
                        />
                    </View>
                    { this._renderSendButton() }
                </View>
                {isEmoji ? this._renderEmoji() : this._renderActions()}
            </View>
        )
    }


    render() {
        return (
            <GiftedChat
                ref={(giftedChat)=> {this.giftedChat = giftedChat} }
                messages={this.state.messages}
                loadEarlier={this.state.loadEarlier}
                onLoadEarlier={this.onLoadEarlier}
                isLoadingEarlier={this.state.isLoadingEarlier}
                isAnimated={false}
                user={{
                    _id: this.props.sender, // sent messages should have same user._id
                }}

                renderBubble={this.renderBubble}
                renderCustomView={this.renderCustomView}
                renderInputToolbar={this.renderInputToolbar}
            />
        );
    }
}

const styles = StyleSheet.create({
    footerContainer: {
        marginTop: 5,
        marginLeft: 10,
        marginRight: 10,
        marginBottom: 10,
    },
    footerText: {
        fontSize: 14,
        color: '#aaa',
    },
});
