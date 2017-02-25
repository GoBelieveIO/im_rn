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
    Clipboard,
    Easing,
    UIManager,
    Animated
} from 'react-native';

import ImagePicker from 'react-native-image-picker'
import ActionSheet from '@exponent/react-native-action-sheet';
import dismissKeyboard from 'react-native-dismiss-keyboard';
import {connect} from 'react-redux'
import {AudioRecorder, AudioUtils} from 'react-native-audio';

import {OpenCoreAMR} from 'react-native-amr';

var Toast = require('react-native-toast')
var UUID = require('react-native-uuid');
var Sound = require('react-native-sound');
var RNFS = require('react-native-fs');
import RCTDeviceEventEmitter from 'RCTDeviceEventEmitter';

if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

console.log("document path:", AudioUtils.DocumentDirectoryPath);

import InputToolbar, {MIN_INPUT_TOOLBAR_HEIGHT} from './InputToolbar';
import MessageContainer from './MessageContainer';
import {playMessage, listenMessage} from './actions';

var IMService = require("./im");


const API_URL = "http://api.gobelieve.io";
const NAVIGATIONBAR_HEIGHT = 0;

export default class Chat extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isInitialized: false, // initialization will calculate maxHeight before rendering the chat
            
            recording: false,
            recordingText:"",
            recordingColor:"transparent",

            canLoadMoreContent:true,

            currentMetering:0,
        };

        this._keyboardHeight = 0;
        this._bottomOffset = 0;
        this._maxHeight = 0;
        this._touchStarted = false;
        this._isFirstLayout = true;
        this._isTypingDisabled = false;
        this._locale = 'zh-cn';
        this._messages = [];

        this._loadMoreContentAsync = this._loadMoreContentAsync.bind(this);
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

        console.log("token:", this.props.token);

    }

    getChildContext() {
        return {
            actionSheet: () => this._actionSheetRef,
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
   
    }

    componentDidMount() {
        AudioRecorder.checkAuthorizationStatus()
                     .then((status)=>{
                         console.log("audio auth status:", status);
                         if (status == "undetermined") {
                             return AudioRecorder.requestAuthorization();
                         }
                     })
                     .then((granted)=>{console.log("audio auth granted")})
                     .catch((e)=>{console.log("audio auth err:", e)});
    }

    componentWillUnmount() {
    
    }

    downloadAudio(message) {
        if (!message.audio) {
            return;
        }
        if (!message.uuid) {
            return;
        }
        if (!message.audio.url) {
            return;
        }
        console.log("audio url:", message.audio.url);
        
        var amrPath = this.getAMRPath(message.uuid);
        var wavPath = this.getWAVPath(message.uuid);


        RNFS.exists(wavPath)
            .then((exists) =>  {
                if (exists) {
                    return Promise.reject("exists");
                }
                return;
            })
            .then(() => {
                var path = AudioUtils.DocumentDirectoryPath + "/audios";
                return RNFS.mkdir(path);
            })
            .then(() => {
                var r = RNFS.downloadFile({
                    fromUrl:message.audio.url,
                    toFile:amrPath
                });

                return r.promise;
            })
            .then((result) => {
                console.log("download result:", result);
                if (result.statusCode == 200) {
                    if (Platform.OS == 'ios') {
                        OpenCoreAMR.amr2WAV(amrPath, wavPath, function(err) {
                            if (err) {
                                console.log("amr 2 wav err:", err);
                            }
                        });
                    }
                }
            })
            .catch((err)=> {
                console.log("err:", err);
            });
    }


    getNow() {
        var now = new Date();
        now = now.getTime()/1000;
        now = Math.floor(now);
        return now;
    }

    uploadAudio(filePath) {
        var url = API_URL + "/v2/audios";
        var formData = new FormData();
        console.log("uri:", filePath);

        var s = filePath.split("/");
        if (s.length == 0) {
            return;
        }

        var fileName = s[s.length-1];
        formData.append('file', {uri: "file://" + filePath, name:fileName, type:"audio/amr-nb"});
        let options = {};
        options.body = formData;
        options.method = 'post';
        options.headers = {
            "Authorization":"Bearer " + this.props.token,
            'Content-Type': 'multipart/form-data',
        };
        return fetch(url, options)
            .then((response) => {
                return Promise.all([response.status, response.json()]);
            })
            .then((values)=>{
                var status = values[0];
                var respJson = values[1];
                if (status != 200) {
                    console.log("upload image fail:", respJson);
                    return Promise.reject(respJson);
                }
                console.log("upload image success:", respJson);
                return respJson.src_url;
            });
    }

    getWAVPath(id) {
        var path = AudioUtils.DocumentDirectoryPath + "/audios";
        var wavPath = path + "/" + id + ".wav";
        return wavPath;
    }
    
    getAMRPath(id) {
        var path = AudioUtils.DocumentDirectoryPath + "/audios";
        var amrPath = path + "/" + id;
        return amrPath;
    }
    
    sendAudioMessage(id, duration) {
        var wavPath = this.getWAVPath(id);
        var amrPath = this.getAMRPath(id);
        console.log("send audio:", id, "duration:", duration);
        var obj = {audio: {duration:duration}, uuid:id};
        var content = JSON.stringify(obj);
        var sender = this.props.sender;
        var receiver = this.props.receiver;
        var now = this.getNow();
        var message = {
            sender:sender,
            receiver:receiver,
            content: content,
            flags:0,
            timestamp:now,

            outgoing:true,
            audio: obj.audio,
            uuid: obj.uuid,
            createdAt: new Date(),
            user: {
                _id: this.props.sender
            }
        };

        var self = this;
        var p = this.saveMessage(message);
        p.then((rowid) => {
            message.id = rowid;
            message._id = rowid;

            this.addMessage(message);

            return this.uploadAudio(amrPath);
            
        }).then((url)=> {
            console.log("audio url:", url);
            var obj = {audio: {url:url, duration:duration}, uuid:id};
            var content = JSON.stringify(obj);
            message.content = content;
            message.audio = obj.audio;
            self.sendMessage(message);
            //todo save url to db
        })
    }
    
    sendTextMessage(text) {
        var id = UUID.v1();
        var obj = {uuid:id, "text": text};
        var textMsg = JSON.stringify(obj);
        var sender = this.props.sender;
        var receiver = this.props.receiver;
        var now = this.getNow();
        var message = {
            sender:sender,
            receiver:receiver,
            content: textMsg,
            flags:0,
            timestamp:now,

            outgoing:true,
            text: text,
            createdAt: new Date(),
            user: {
                _id: this.props.sender
            }
        };

        var self = this;
        var p = this.saveMessage(message);
        p.then((rowid)=> {
            message.id = rowid;
            message._id = rowid;
            self.addMessage(message);
            self.setState({
                value: '',
            });
            self.sendMessage(message);
        });
    }


    uploadImage(uri, fileName) {
        var url = API_URL + "/v2/images";
        var formData = new FormData();
        formData.append('file', {uri: uri, name:fileName, type:"image/jpeg"});
        let options = {};
        options.body = formData;
        options.method = 'POST';
        options.headers = {
            'Content-Type': 'multipart/form-data; boundary=6ff46e0b6b5148d984f148b6542e5a5d',
            "Authorization":"Bearer " + this.props.token,
        };
        return fetch(url, options)
            .then((response) => {
                return Promise.all([response.status, response.json()]);
            })
            .then((values)=>{
                var status = values[0];
                var respJson = values[1];
                if (status != 200) {
                    console.log("upload image fail:", respJson);
                    Promise.reject(respJson);
                    return;
                }
                console.log("upload image success:", respJson);
                return respJson.src_url;
            });
    }


    
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
    sendImageMessage(image) {
        var uri;
        var fileName;
        if (Platform.OS === 'ios') {
            uri = image.uri.replace('file://', '');

            //ios xcode每次run时，document目录都会变化
            var imagePath = AudioUtils.DocumentDirectoryPath + "/images/";
            fileName = uri.substr(imagePath.length);
            console.log("fileName:", fileName);
        } else {
            uri = image.uri;
            fileName = "";
            console.log("fileName:", fileName);
        }

        console.log("send image message:", image.uri);
        var id = UUID.v1();
        var obj = {
            image2: {
                url:uri,
                fileName:fileName,
                width:image.width,
                height:image.height
            },
            uuid:id
        };
        
        var content = JSON.stringify(obj);
        var sender = this.props.sender;
        var receiver = this.props.receiver;
        var now = this.getNow();
        var message = {
            sender:sender,
            receiver:receiver,
            content: content,
            flags:0,
            timestamp:now,

            outgoing:true,
            image: obj.image2,
            createdAt: new Date(),
            user: {
                _id: this.props.sender
            }
        };

        var self = this;

        var p = this.saveMessage(message);
        
        p.then((rowid) => {
            message.id = rowid;
            message._id = rowid;
            self.addMessage(message);
            
            return message;
        }).then((message) => {
            return this.uploadImage(image.uri, image.fileName);
        }).then((url) => {
            console.log("upload image success url:", url);
            var obj = {
                image2: {
                    url:url,
                    width:image.width,
                    height:image.height
                },
                uuid:id,
            };
            
            var content = JSON.stringify(obj);
            message.content = content;
            self.sendMessage(message);
            //todo save url
        }).catch((err) => {
            console.log("upload image err:", err);
        });
    }

    sendLocationImage(longitude, latitude) {
        console.log("longitude:" + longitude + " latitude:" + latitude);

        var id = UUID.v1();
        var obj = {
            location:{
                longitude:longitude,
                latitude:latitude
            },
            uuid:id
        };
        
        var content = JSON.stringify(obj);
        var sender = this.props.sender;
        var receiver = this.props.receiver;
        var now = this.getNow();
        var message = {
            sender:sender,
            receiver:receiver,
            content: content,
            flags:0,
            timestamp:now,

            outgoing:true,
            location: obj.location,
            createdAt: new Date(),
            user: {
                _id: this.props.sender
            }
        };
        
        var self = this;

        var p = this.saveMessage();
        p.then((rowid)=> {
            console.log("row id:", rowid);
            message.id = rowid;
            message._id = rowid;

            this.addMessage(message);
            this.sendMessage(message);
        });
    }
    
    onSend(text) {
        if (!text || !text.trim()) {
            return;
        }
        console.log("send text:", text);        
        text = text.trim();
        this.sendTextMessage(text);
    }


    handleImagePicker() {
        const options = {
            maxWidth:1024,
            storageOptions: {
                skipBackup: true,
                path: 'images'
            }
        }
        ImagePicker.launchImageLibrary(options, (response) => {
            console.log('Response = ', response);

            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            } else if (response.customButton) {
                console.log('User tapped custom button: ', response.customButton);
            } else {
                this.sendImageMessage(response)
            }
        });
    }

    handleCameraPicker() {
        const options = {
            maxWidth:1024,
            storageOptions: {
                skipBackup: true,
                path: 'images'
            }
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
                this.sendImageMessage(response);
            }
        });
    }

    

    handleLocationClick() {
        console.log("locaiton click");

        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.sendLocationImage(position.coords.longitude,
                                       position.coords.latitude);
            },
            (error) => alert(error.message),
            {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
        );

    }

    onMessageLongPress(message) {
        console.log("on message long press:", message);
        if (message.text) {
            const options = [
                'Copy Text',
                'Cancel',
            ];
            const cancelButtonIndex = options.length - 1;
            this._actionSheetRef.showActionSheetWithOptions({
                options,
                cancelButtonIndex,
            }, (buttonIndex) => {
                switch (buttonIndex) {
                    case 0:
                        Clipboard.setString(message.text);
                        break;
                }
            });
        }
    }

    stopPlayer() {
        if (this.player) {
            var msgID = this.playingMessage.id;
            this.player.stop();
            this.player.release();
            this.player = null;
            this.playingMessage = null;
            clearInterval(this.playingTimer);
            this.props.dispatch(playMessage(msgID, false));
        }
    }
    
    onMessagePress(message) {
        console.log("on message press:", message);
        if (message.audio && message.uuid) {

            //停止正在播放的消息
            if (this.player && this.playingMessage.id == message.id) {
                this.stopPlayer();
                return;
            }

            var audioFile;
            if (Platform.OS == 'android') {
                audioFile = this.getAMRPath(message.uuid);
            } else {
                audioFile = this.getWAVPath(message.uuid);
            }
            RNFS.exists(audioFile)
                .then((exists) =>  {
                    if (!exists) {
                        return Promise.reject("audio file non exists");
                    }

                    if (this.player) {
                        this.stopPlayer();
                    }
                    
                    console.log("playing message...:", audioFile);

                    return new Promise((resolve, reject) => {
                        var player = new Sound(audioFile, null);
                        Sound.enable(true);
                        player.prepare((error) => {
                            if (error) {
                                console.log('failed to load the sound', error);
                                reject(error);
                                return;
                            }
                            resolve(player);
                        });
                    });
                })
                .then((player) => {
                    var self = this;
                    var msgID = message.id;
                    this.props.dispatch(listenMessage(msgID));
                    this.setMessageListened(message);
                    this.playingTimer = setInterval(function() {
                        self.props.dispatch(playMessage(msgID, true));
                    }, 200);
                    this.playingMessage = message;
                    this.player = player
                    this.player.play((success)=> {
                        console.log("play:", message.uuid,
                                    "result:", success);

                        this.stopPlayer();
                    });
                })
                .catch((err) => {
                    console.log("error:", err);
                });

        }
        if (message.image) {
            var navigator = this.props.navigator;

            if (Platform.OS === 'android') {
                navigator.push({
                    screen:"chat.Photo",
                    passProps:{
                        url:message.image.url
                    },
                    navigatorStyle:{
                        tabBarHidden:true
                    },
                    navigatorStyle: {
                        statusBarHideWithNavBar:true,
                        statusBarHidden:true,
                    },
                });
            } else {
                navigator.showLightBox({
                    screen:"chat.Photo",
                    passProps:{
                        url:message.image.url
                    },
                    navigatorStyle: {
                        statusBarHideWithNavBar:true,
                        statusBarHidden:true,
                    },
                });
            }
        }
    }
    
    startRecording() {
        this.stopPlayer();
        
        this.recordingBegin = new Date();

        var self = this;
        var fileName = Platform.select({
            ios: "recording.wav",
            android: "recording.amr",
        });
        var audioPath = AudioUtils.DocumentDirectoryPath + "/" + fileName;
        AudioRecorder.onProgress = function(data) {
            console.log("record progress:", data);

            var metering = data.currentMetering;
            //ios: [-160, 0]
            metering = Math.max(metering, -160);
            metering = Math.min(metering, 0);

            //to [0, 20]
            var t = 20*(metering - (-160))/160;
            t = Math.floor(t);
            self.setState({currentMetering:t});
        };
        AudioRecorder.prepareRecordingAtPath(audioPath, {
            SampleRate: 8000,
            Channels: 2,
            OutputFormat: Platform.select({
                ios: "",
                android: "amr_nb",
            }),
            AudioEncoding: Platform.select({
                ios: "lpcm",
                android: "amr_nb",
            }),
            MeteringEnabled:true,
        });

        AudioRecorder.startRecording();
    }

    stopRecording(canceled) {
        AudioRecorder.stopRecording();
        
        if (canceled) {
            return;
        }

        var now = new Date();
        var duration = now.getTime() - this.recordingBegin.getTime();
        duration = Math.floor(duration/1000);

        if (duration < 1) {
            console.log("record time too short");
            Toast.showShortBottom('录音时间太短了')
            return;
        }

        
        var self = this;
        var id = UUID.v1();


        var fileName = Platform.select({
            ios: "recording.wav",
            android: "recording.amr",
        });
        var audioPath = AudioUtils.DocumentDirectoryPath + "/" + fileName;
        if (Platform.OS == 'android') {
            var path = AudioUtils.DocumentDirectoryPath + "/audios";
            var amrPath = path + "/" + id;
            RNFS.mkdir(path)
                .then(() => {
                    console.log("move file");
                    return RNFS.moveFile(audioPath, amrPath);
                })
                .then(() => {
                    self.sendAudioMessage(id, duration);
                })
                .catch((err) => {
                    console.log("error:", err);
                });            
        } else {
            var path = AudioUtils.DocumentDirectoryPath + "/audios";
            var wavPath = path + "/" + id + ".wav";
            var amrPath = path + "/" + id;
            RNFS.mkdir(path)
                .then(() => {
                    console.log("move file");
                    return RNFS.moveFile(audioPath, wavPath);
                })
                .then(() => {
                    return new Promise((resolve, reject) => {
                        OpenCoreAMR.wav2AMR(wavPath, amrPath, function(err) {
                            if (err) {
                                console.log("wav 2 arm err:", err);
                                return reject(err);
                            }
                            resolve();
                        });
                    });
                })
                .then(() => {
                    self.sendAudioMessage(id, duration);
                })
                .catch((err) => {
                    console.log("error:", err);
                });
        }
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

        this.inputToolbar.actionBarHeight = 0;
        var newMessagesContainerHeight = this.getMaxHeight() - this.inputToolbar.getToolbarHeight() - this.getKeyboardHeight();
        console.log("keyboard will show:", e, newMessagesContainerHeight);
        console.log("keyboard height:", e.endCoordinates ? e.endCoordinates.height : e.end.height);

        if (e && e.duration && e.duration > 0) {
            var animation = LayoutAnimation.create(
                e.duration,
                LayoutAnimation.Types[e.easing],
                LayoutAnimation.Properties.opacity);
            LayoutAnimation.configureNext(animation);
        }
        this.setState({
            messagesContainerHeight:new Animated.Value(newMessagesContainerHeight)
        });
    }

    onKeyboardWillHide(e) {
        this.setKeyboardHeight(0);
        var newMessagesContainerHeight = this.getMaxHeight() - this.inputToolbar.getToolbarHeight() - this.getKeyboardHeight();

        console.log("keyboard will hide:", e, newMessagesContainerHeight, this.getMaxHeight(), this.inputToolbar.getToolbarHeight(), this.getKeyboardHeight());

        if (e && e.duration && e.duration > 0) {
            var animation = LayoutAnimation.create(
                e.duration,
                LayoutAnimation.Types[e.easing],
                LayoutAnimation.Properties.opacity);
            LayoutAnimation.configureNext(animation);
        }
        
        this.setState({
            messagesContainerHeight:new Animated.Value(newMessagesContainerHeight)
        });
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
            this.inputToolbar.dismiss();
        }
        this._touchStarted = false;
    }

    prepareMessagesContainerHeight(value) {
        var v = new Animated.Value(value);
        console.log("prepare message container height:", v);
        return v;
    }

    onInputToolbarHeightChange(h) {
        console.log("on input tool bar height changed:", h);
        const newMessagesContainerHeight = this.getMaxHeight() - this.inputToolbar.getToolbarHeight() - this.getKeyboardHeight();

        console.log("new message container height:",
                    newMessagesContainerHeight);
        
        LayoutAnimation.configureNext(LayoutAnimation.create(
            100,
            LayoutAnimation.Types.linear,
            LayoutAnimation.Properties.opacity
        ));
        
        this.setState({
            messagesContainerHeight:new Animated.Value(newMessagesContainerHeight)
        });
    }

    addMessage(message) {
        console.log("add message not implement");            
    }
    
    saveMessage(message) {
        console.log("save message not implement");        
    }

    setMessageListened(message) {
        console.log("setMessageListened not implement");
    }

    setMessageFailure(message) {
        console.log("setMessageFailure not implement");
    }
    
    sendMessage(message) {
        console.log("send message not implement");
    }
    _loadMoreContentAsync = async () => {
        console.log("loadMoreContentAsync not implement");
    }
    
    renderMessages() {
        return (
            <Animated.View style={{height: this.state.messagesContainerHeight }}>
                <MessageContainer

                    canLoadMore={this.state.canLoadMoreContent}
                    onLoadMoreAsync={this._loadMoreContentAsync}
                    
                    user={{
                        _id: this.props.sender, // sent messages should have same user._id
                    }}
                    
                    invertibleScrollViewProps={this.invertibleScrollViewProps}

                    onMessageLongPress={this.onMessageLongPress.bind(this)}
                    onMessagePress={this.onMessagePress.bind(this)}
                    messages={this.props.messages}

                    ref={component => this._messageContainerRef = component}
                />
            </Animated.View>
        );
    }

    
    renderInputToolbar() {
        const inputToolbarProps = {
            onSend: this.onSend.bind(this),
            onHeightChange:this.onInputToolbarHeightChange.bind(this),
            giftedChat: this,
            
        };

        return (
            <InputToolbar
                ref={(input) => this.inputToolbar = input}
                {...inputToolbarProps}
            />
        );
    }


    renderRecordView() {
        var images = [
            require("./Images/VoiceSearchFeedback000.png"),
            require("./Images/VoiceSearchFeedback001.png"),
            require("./Images/VoiceSearchFeedback002.png"),
            require("./Images/VoiceSearchFeedback003.png"),
            require("./Images/VoiceSearchFeedback004.png"),
            require("./Images/VoiceSearchFeedback005.png"),
            require("./Images/VoiceSearchFeedback006.png"),
            require("./Images/VoiceSearchFeedback007.png"),
            require("./Images/VoiceSearchFeedback008.png"),
            require("./Images/VoiceSearchFeedback009.png"),
            require("./Images/VoiceSearchFeedback010.png"),
            require("./Images/VoiceSearchFeedback011.png"),
            require("./Images/VoiceSearchFeedback012.png"),
            require("./Images/VoiceSearchFeedback013.png"),
            require("./Images/VoiceSearchFeedback014.png"),
            require("./Images/VoiceSearchFeedback015.png"),
            require("./Images/VoiceSearchFeedback016.png"),
            require("./Images/VoiceSearchFeedback017.png"),
            require("./Images/VoiceSearchFeedback018.png"),
            require("./Images/VoiceSearchFeedback019.png"),
            require("./Images/VoiceSearchFeedback020.png"),
        ];
        
        const {width, height} = Dimensions.get('window');
        var left = this.state.recording ? 0 : width;
        const {recordingText, recordingColor, currentMetering} = this.state;
        //currentMetering [0, 20]
        return (
            <Animated.View style={{position:"absolute",
                                   top:0,
                                   left:left,
                                   width:width,
                                   height:this.state.messagesContainerHeight,
                                   alignItems:"center",
                                   justifyContent:"center"}}>
                <View style={{backgroundColor:"#dcdcdcaf",
                              alignItems:"center",
                              borderRadius:4}}>
                    <Image source={images[currentMetering]}/>
                    <Text style={{margin:4,
                                  padding:4,
                                  backgroundColor:recordingColor}}>
                        {recordingText}
                    </Text>
                </View>
            </Animated.View>);
        
    }

    render() {
        const {width, height} = Dimensions.get('window');
        
        if (this.state.isInitialized === true) {
            var onViewLayout = (e) => {
                if (Platform.OS === 'android') {
                    // fix an issue when keyboard is dismissing during the initialization
                    const layout = e.nativeEvent.layout;
                    if (this.getMaxHeight() !== layout.height &&
                        this.getIsFirstLayout() === true) {
                        this.setMaxHeight(layout.height);

                        var t = this.prepareMessagesContainerHeight(this.getMaxHeight() - 44);
                        console.log("set message container height:", t);
                        this.setState({
                            messagesContainerHeight: t
                        });
                    }
                }
                if (this.getIsFirstLayout() === true) {
                    this.setIsFirstLayout(false);
                }
            };
            return (
                <ActionSheet ref={component => this._actionSheetRef = component}>
                    <View
                        style={{marginTop:NAVIGATIONBAR_HEIGHT, flex:1, backgroundColor:"white"}}
                        onLayout={onViewLayout}>
                        {this.renderMessages()}
                        {this.renderRecordView()}
                        {this.renderInputToolbar()}
                    </View>
                </ActionSheet>
            );
        }

        var onViewLayout = (e) => {
            const layout = e.nativeEvent.layout;
            if (layout.height == 0) {
                return;
            }
            this.setMaxHeight(layout.height);
            console.log("max height:", layout.height);
            InteractionManager.runAfterInteractions(() => {
                var t = this.prepareMessagesContainerHeight(this.getMaxHeight() - MIN_INPUT_TOOLBAR_HEIGHT);
                var self = this;

                console.log("set message container height:", t);
                this.setState({
                    isInitialized: true,
                    messagesContainerHeight: t
                });
            });
        };
        return (
            <View style={{marginTop:NAVIGATIONBAR_HEIGHT, flex:1, backgroundColor:"white"}}
                  onLayout={onViewLayout} >
            </View>
        );
    }

    
}


Chat.childContextTypes = {
    actionSheet: React.PropTypes.func,
    getLocale: React.PropTypes.func,
};




