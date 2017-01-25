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
    InteractionManager,
    Animated
} from 'react-native';

import ImagePicker from 'react-native-image-picker'
import Emoji from 'react-native-emoji'
import Swiper from 'react-native-swiper'
import moment from 'moment/min/moment-with-locales.min';
import ActionSheet from '@exponent/react-native-action-sheet';
import dismissKeyboard from 'react-native-dismiss-keyboard';
import {connect} from 'react-redux'
import {AudioRecorder, AudioUtils} from 'react-native-audio';
import {OpenCoreAMR} from 'react-native-amr';


import Actions from './gifted-chat/Actions';
import Avatar from './gifted-chat/Avatar';
import Bubble from './gifted-chat/Bubble';
import MessageImage from './gifted-chat/MessageImage';
import MessageText from './gifted-chat/MessageText';
import Composer from './gifted-chat/Composer';
import Day from './gifted-chat/Day';
import InputToolbar from './gifted-chat/InputToolbar';
import LoadEarlier from './gifted-chat/LoadEarlier';
import Message from './gifted-chat/Message';
import MessageContainer from './gifted-chat/MessageContainer';
import Send from './gifted-chat/Send';
import Time from './gifted-chat/Time';


import CustomActions from './CustomActions'
import CustomView from './CustomView'

import Styles from './Styles/MessageScreenStyle'
import {Images, Colors, Metrics} from './Themes'
import PeerMessageDB from './PeerMessageDB.js'
import {setMessages, addMessage, ackMessage} from './actions'


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


class PeerChat extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loadEarlier: true,
            isLoadingEarlier: false,

            isInitialized: false, // initialization will calculate maxHeight before rendering the chat
            
            recording: false,
            recordingText:"",
            recordingColor:"transparent",
        };

        this.onLoadEarlier = this.onLoadEarlier.bind(this);

        // default values
        this._isMounted = false;
        this._keyboardHeight = 0;
        this._bottomOffset = 0;
        this._maxHeight = null;
        this._touchStarted = false;
        this._isFirstLayout = true;
        this._isTypingDisabled = false;
        this._locale = 'zh-cn';
        this._messages = [];

        this.isAnimated = false;

        this.onSend = this.onSend.bind(this);
        
        
        this.onTouchStart = this.onTouchStart.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);
        this.onKeyboardWillShow = this.onKeyboardWillShow.bind(this);
        this.onKeyboardWillHide = this.onKeyboardWillHide.bind(this);
        this.onKeyboardDidShow = this.onKeyboardDidShow.bind(this);
        this.onKeyboardDidHide = this.onKeyboardDidHide.bind(this);
        
        this.invertibleScrollViewProps = {
            inverted: true,
            keyboardShouldPersistTaps: "always",
            onTouchStart: this.onTouchStart,
            onTouchMove: this.onTouchMove,
            onTouchEnd: this.onTouchEnd,
            onKeyboardWillShow: this.onKeyboardWillShow,
            onKeyboardWillHide: this.onKeyboardWillHide,
            onKeyboardDidShow: this.onKeyboardDidShow,
            onKeyboardDidHide: this.onKeyboardDidHide,
        };

    }

    getChildContext() {
        return {
            getLocale: this.getLocale.bind(this),
        };
    }
    
    setLocale(locale) {
        this._locale = locale;
    }

    getLocale() {
        return this._locale;
    }
    
    componentWillMount() {
        this._isMounted = true;
        PeerMessageDB.getInstance().getMessages(this.props.receiver,
                                                (msgs)=>{
                                                    for (var i in msgs) {
                                                        var m = msgs[i];
                                                        var obj = JSON.parse(m.content);
                                                        var t = new Date();
                                                        t.setTime(m.timestamp*1000);

                                                        m._id = m.id;
                                                        m.text = obj.text;
                                                        m.createdAt = t;
                                                        m.user = {
                                                            _id:m.sender
                                                        };
                                                    }
                                                    console.log("set messages:", msgs.length);
                                                    this.props.dispatch(setMessages(msgs));
                                                },
                                                (e)=>{});


        console.log("dispatch:", this.props.dispatch);
    }

    componentDidMount() {
        AudioRecorder.checkAuthorizationStatus().
                      then((status)=>{
                          console.log("audio auth status:", status);
                          if (status == "undetermined") {
                              return AudioRecorder.requestAuthorization();
                          }
                      })
                     .then((granted)=>{console.log("audio auth granted")})
                     .catch((e)=>{console.log("audio auth err:", e)});
    }

    componentWillUnmount() {
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

    getNow() {
        var now = new Date();
        now = now.getTime()/1000;
        now = Math.floor(now);
        return now;
    }
    
    sendTextMessage(text) {
        var obj = {"text": text};
        var textMsg = JSON.stringify(obj);
        var sender = this.props.sender;
        var receiver = this.props.receiver;
        var now = this.getNow();
        var message = {sender:sender, receiver:receiver, content: textMsg, flags:0, timestamp:now, msgLocalID:1};

        var self = this;
        PeerMessageDB.getInstance().insertMessage(message, this.props.receiver,
                                                  function(rowid) {
                                                      console.log("row id:", rowid);
                                                      message.id = rowid;
                                                      message._id = rowid;
                                                      message.text = text;
                                                      message.createAt = new Date();
                                                      message.user = {
                                                          _id: self.props.sender
                                                      }

                                                      self.props.dispatch(addMessage(message));
                                                      self.setState({
                                                          value: '',
                                                      });

                                                      var im = IMService.instance;
                                                      if (im.connectState == IMService.STATE_CONNECTED) {
                                                          im.sendPeerMessage(message);
                                                      }
                                                  },
                                                  function(err) {
                                                      
                                                  });
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




    /* renderBubble(props) {
     *     return (
     *         <Bubble
     *             {...props}
     *             wrapperStyle={{
     *                 left: {
     *                     backgroundColor: '#f0f0f0',
     *                 }
     *             }}
     *         />
     *     );
     * }*/




    onSend(text) {
        if (!text || !text.trim()) {
            return;
        }
        console.log("send text:", text);        
        text = text.trim();
        this.sendTextMessage(text);
        this.scrollToBottom();
    }


    handleImagePicker() {
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




    startRecording() {
        var audioPath = AudioUtils.DocumentDirectoryPath + "/recording.wav";
        AudioRecorder.prepareRecordingAtPath(audioPath, {
            SampleRate: 8000,
            Channels: 2,
            AudioEncoding: "lpcm",
        });

        AudioRecorder.startRecording();
    }

    stopRecording() {
        AudioRecorder.stopRecording();
        var audioPath = AudioUtils.DocumentDirectoryPath + "/recording.wav";
        var amrPath = AudioUtils.DocumentDirectoryPath + "/recording.amr";
        OpenCoreAMR.wav2AMR(audioPath, amrPath, function(r) {
            console.log("result:", r);
        });
        
    }
    


    render2() {
        return (
            <GiftedChat
                ref={(giftedChat)=> {this.giftedChat = giftedChat} }
                messages={this.props.messages}
                loadEarlier={this.state.loadEarlier}
                onLoadEarlier={this.onLoadEarlier}
                isLoadingEarlier={this.state.isLoadingEarlier}
                isAnimated={false}
                user={{
                    _id: this.props.sender, // sent messages should have same user._id
                }}
            />
        );
    }

    
    setRecording(recording) {
        this.setState({recording:recording});
    }

    setRecordingText(text) {
        console.log("set text");
        this.setState({recordingText:text});
    }
    
    setRecordingColor(color) {
        console.log("set color");
        this.setState({recordingColor:color});
    }


    setMaxHeight(height) {
        this._maxHeight = height;
    }

    getMaxHeight() {
        return this._maxHeight;
    }

    setIsFirstLayout(value) {
        this._isFirstLayout = value;
    }

    getIsFirstLayout() {
        return this._isFirstLayout;
    }
    
    setKeyboardHeight(height) {
        this._keyboardHeight = height;
    }

    getKeyboardHeight() {
        return this._keyboardHeight;
    }

    

    onKeyboardWillShow(e) {
        this.setKeyboardHeight(e.endCoordinates ? e.endCoordinates.height : e.end.height);
        var newMessagesContainerHeight = this.state.messagesContainerHeight - this.getKeyboardHeight();
        console.log("keyboard will show:", newMessagesContainerHeight);
        console.log("keyboard height:", e.endCoordinates ? e.endCoordinates.height : e.end.height);
        if (this.props.isAnimated === true) {
            Animated.timing(this.state.messagesContainerHeight, {
                toValue: newMessagesContainerHeight,
                duration: 210,
            }).start();
        } else {
            this.setState((previousState) => {
                return {
                    messagesContainerHeight: newMessagesContainerHeight,
                };
            });
        }
    }

    onKeyboardWillHide() {
        var newMessagesContainerHeight = this.state.messagesContainerHeight + this.getKeyboardHeight();
        this.setKeyboardHeight(0);
        console.log("keyboard will hide:", newMessagesContainerHeight);
        if (this.props.isAnimated === true) {
            Animated.timing(this.state.messagesContainerHeight, {
                toValue: newMessagesContainerHeight,
                duration: 210,
            }).start();
        } else {
            this.setState((previousState) => {
                return {
                    messagesContainerHeight: newMessagesContainerHeight,
                };
            });
        }
    }

    onKeyboardDidShow(e) {
        if (Platform.OS === 'android') {
            this.onKeyboardWillShow(e);
        }
    }

    onKeyboardDidHide(e) {
        if (Platform.OS === 'android') {
            this.onKeyboardWillHide(e);
        }
    }

    scrollToBottom(animated = true) {
        this._messageContainerRef.scrollTo({
            y: 0,
            animated,
        });
    }

    onTouchStart() {
        this._touchStarted = true;
    }

    onTouchMove() {
        this._touchStarted = false;
    }

    // handle Tap event to dismiss keyboard
    onTouchEnd() {
        if (this._touchStarted === true) {
            dismissKeyboard();
        }
        this._touchStarted = false;
    }

    prepareMessagesContainerHeight(value) {
        //if (this.props.isAnimated === true) {
        //    return new Animated.Value(value);
        //}
        return value;
    }

    onInputToolbarHeightChange(h) {
        console.log("on input tool bar height changed:", h);
        const newMessagesContainerHeight = this.getMaxHeight() - h - this.getKeyboardHeight();
        this.setState((previousState) => {
            return {
                messagesContainerHeight: newMessagesContainerHeight,
            };
        });
        
    }

    renderMessages() {
        console.log("message containser height:", this.state.messagesContainerHeight);
        const AnimatedView = this.props.isAnimated === true ? Animated.View : View;
        //    
        return (
            <AnimatedView style={{
                height: this.state.messagesContainerHeight,
            }}>
                <MessageContainer
                    loadEarlier={this.state.loadEarlier}
                    onLoadEarlier={this.onLoadEarlier}
                    isLoadingEarlier={this.state.isLoadingEarlier}
                    user={{
                        _id: this.props.sender, // sent messages should have same user._id
                    }}
                    
                    invertibleScrollViewProps={this.invertibleScrollViewProps}

                    messages={this.props.messages}

                    ref={component => this._messageContainerRef = component}
                />
            </AnimatedView>
        );
    }

    
    
    renderInputToolbar() {
        const inputToolbarProps = {
            ...this.props,
            text: this.state.text,
            onSend: this.onSend.bind(this),
            onHeightChange:this.onInputToolbarHeightChange.bind(this),
            giftedChat: this,
        };

        return (
            <InputToolbar
                {...inputToolbarProps}
            />
        );
    }

    

    renderRecordView() {
        const {width, height} = Dimensions.get('window');
        var left = this.state.recording ? 0 : -width;
        const {recordingText, recordingColor} = this.state;
        return (
            <View style={{backgroundColor:"#dcdcdcaf",
                          position:"absolute",
                          top:0,
                          left:left,
                          width:width,
                          height:this.state.messagesContainerHeight,
                          alignItems:"center",
                          justifyContent:"center"}}>
                <Text style={{backgroundColor:recordingColor}}>
                    {recordingText}
                </Text>
            </View>);
        
    }
    

    render() {
        console.log("render chat...:", Dimensions.get('window'));

        if (this.state.isInitialized === true) {

            console.log("render chat1");
            return (
                <ActionSheet ref={component => this._actionSheetRef = component}>
                    <View
                        style={{flex:1}}
                        onLayout={(e) => {
                                if (Platform.OS === 'android') {
                                    // fix an issue when keyboard is dismissing during the initialization
                                    const layout = e.nativeEvent.layout;
                                    if (this.getMaxHeight() !== layout.height && this.getIsFirstLayout() === true) {
                                        this.setMaxHeight(layout.height);
                                        this.setState({
                                            messagesContainerHeight: this.prepareMessagesContainerHeight(this.getMaxHeight() - 44),
                                        });
                                    }
                                }
                                if (this.getIsFirstLayout() === true) {
                                    this.setIsFirstLayout(false);
                                }
                            }}>
                        {this.renderMessages()}
                        {this.renderRecordView()}
                        {this.renderInputToolbar()}
                    </View>
                </ActionSheet>
            );
        }

        console.log("render chat2");
        return (
            <View
            style={{flex:1}}
            onLayout={(e) => {
                const layout = e.nativeEvent.layout;
                this.setMaxHeight(layout.height);
                console.log("max height:", layout.height);
                InteractionManager.runAfterInteractions(() => {
                    this.setState({
                        isInitialized: true,
                        text: '',
                        messagesContainerHeight: (this.getMaxHeight() - 44)
                    });
                });
            }}
            >
            </View>
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


PeerChat.childContextTypes = {
    getLocale: React.PropTypes.func,
};


PeerChat = connect(function(state){
    return {messages:state.messages};
})(PeerChat);

export default PeerChat;
