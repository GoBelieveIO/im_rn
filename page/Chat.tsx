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
    Easing,
    UIManager,
    Animated,
    FlatList,
    LayoutAnimationTypes,
    LayoutAnimationProperties
} from 'react-native';

import ImagePicker from 'react-native-image-picker'
//import ActionSheet from '@exponent/react-native-action-sheet';
//import {AudioRecorder, AudioUtils} from 'react-native-audio';
// var AudioUtils;
var AudioRecorder;//disable audio record
import {OpenCoreAMR} from 'react-native-amr';
import {request, check, PERMISSIONS} from 'react-native-permissions';

import UUID from 'react-native-uuid';
import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';

import {MESSAGE_FLAG_LISTENED, Message as IMessage, IM} from "../model/IMessage";
import Message from "../chat/Message";
import PropTypes from 'prop-types';
import TextInputToolbar, {MIN_INPUT_TOOLBAR_HEIGHT} from '../chat/TextInputToolbar';
const InputToolbar = TextInputToolbar;

import api from "../api";
import {MESSAGE_LIST_INVERTED, ENABLE_NATIVE_NAVIGATOR} from "../config";

const NAVIGATIONBAR_HEIGHT = 0;

if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

var Permissions = {
    getPermissionStatus: function(permission) {
        if (permission == "location") {
            return check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        } else {
            return Promise.resolve("denied");
        }
    },

    requestPermission: function(permission) {
        if (permission == "location") {
            return request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        } else {
            return Promise.resolve("denied");
        }
    },
}

interface Props {
    sender:string;
    receiver:string;
    emitter:any;
    peer?:any;
    groupID?:any;
    name?:string;
    im:IM;
}

interface Stat {
    isInitialized:boolean;
    loading:boolean;

    recording:boolean;
    recordingText:string;
    recordingColor:string;

    currentMetering:number;
    canLoadMoreContent:boolean;
    messages:IMessage[];

    value:string;
    messagesContainerHeight:any;
}

export default class Chat extends React.Component<Props, Stat> {
    _keyboardHeight:number;
    _maxHeight:number;
    _isFirstLayout:boolean;
    _locale:string;
    _messages:any[];

    player:any;
    playingMessage:any;
    playingTimer:any;

    recordingBegin:any;

    inputToolbar:any;
    listRef:any;

    static childContextTypes = {
        getLocale:PropTypes.func
    };

    constructor(props) {
        super(props);
        this.state = {
            isInitialized: false, // initialization will calculate maxHeight before rendering the chat
            loading:false,//loading message

            recording: false,
            recordingText:"",
            recordingColor:"transparent",

            canLoadMoreContent:true,
            messages:[],
            currentMetering:0,
            value:"",
            messagesContainerHeight:0,
        };

        this._keyboardHeight = 0;
        this._maxHeight = 0;
        this._isFirstLayout = true;
        this._locale = 'zh-cn';
        this._messages = [];

        this.loadMoreContentAsync = this.loadMoreContentAsync.bind(this);
        this.onSend = this.onSend.bind(this);
        

        this.onKeyboardWillShow = this.onKeyboardWillShow.bind(this);
        this.onKeyboardWillHide = this.onKeyboardWillHide.bind(this);
        this.onKeyboardDidShow = this.onKeyboardDidShow.bind(this);
        this.onKeyboardDidHide = this.onKeyboardDidHide.bind(this);

        this.renderRow = this.renderRow.bind(this);
        this.onMessageLongPress = this.onMessageLongPress.bind(this);
        this.onMessagePress = this.onMessagePress.bind(this);
        this.onMessageListPress = this.onMessageListPress.bind(this);

        this.onSend = this.onSend.bind(this);
        this.onInputToolbarHeightChange = this.onInputToolbarHeightChange.bind(this);
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

    componentDidMount() {
        if (Platform.OS === 'ios') {
            Keyboard.addListener("keyboardWillShow", this.onKeyboardWillShow);
            Keyboard.addListener("keyboardWillHide", this.onKeyboardWillHide);
            Keyboard.addListener("keyboardDidShow", this.onKeyboardDidShow);
            Keyboard.addListener("keyboardDidHide", this.onKeyboardDidHide);
        }
        Promise.resolve()
            .then(()=> {
                return Permissions.getPermissionStatus('location');
            })
            .then((response) => {
                if (response == 'undetermined') {
                    return Permissions.requestPermission('location');
                } else {
                    return response;
                }
            })
            .then((granted)=> {
                console.log("location auth granted:", granted);
            })
            .catch((e)=>{console.log("auth err:", e)});
    }

    componentWillUnmount() {
        if (Platform.OS === 'ios') {
            Keyboard.removeListener("keyboardWillShow", this.onKeyboardWillShow);
            Keyboard.removeListener("keyboardWillHide", this.onKeyboardWillHide);
            Keyboard.removeListener("keyboardDidShow", this.onKeyboardDidShow);
            Keyboard.removeListener("keyboardDidHide", this.onKeyboardDidHide);
        }
    }

    addMessage(message, sending) {
        if (MESSAGE_LIST_INVERTED) {
            this.state.messages.splice(0, 0, message);
        } else {
            this.state.messages.push(message);
            this.setState({}, () => {
                this.scrollToBottom();
            });
        }
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
                var path = RNFS.DocumentDirectoryPath + "/audios";
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
        var t = now.getTime()/1000;
        t = Math.floor(t);
        return t;
    }

    getWAVPath(id) {
        var path = RNFS.DocumentDirectoryPath + "/audios";
        var wavPath = path + "/" + id + ".wav";
        return wavPath;
    }
    
    getAMRPath(id) {
        var path = RNFS.DocumentDirectoryPath + "/audios";
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
            id:0,
            _id:0,
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

            this.addMessage(message, true);

            return api.uploadAudio(amrPath);
            
        }).then((url)=> {
            console.log("audio url:", url);
            var obj = {audio: {url:url, duration:duration}, uuid:id};
            var content = JSON.stringify(obj);
            message.content = content;
            message.audio = obj.audio;
            self.sendMessage(message);
            this.updateMessageAttachment(message.id, url);
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
            id:0,
            _id:0,
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
            self.addMessage(message, true);
            self.setState({
                value: '',
            });
            self.sendMessage(message);
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
            var imagePath = RNFS.DocumentDirectoryPath + "/images/";
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
            id:0,
            _id:0,
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
            self.addMessage(message, true);
            
            return message;
        }).then((message) => {
            return api.uploadImage(image.uri, image.fileName);
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

            this.updateMessageAttachment(message.id, url);
            var content = JSON.stringify(obj);
            message.content = content;
            self.sendMessage(message);
        }).catch((err) => {
            console.log("upload image err:", err);
        });
    }

    sendLocationImage(longitude, latitude, address) {
        console.log("longitude:", longitude,
                    " latitude:", latitude,
                    " address:", address);

        var id = UUID.v1();
        var obj:any = {
            location:{
                longitude:longitude,
                latitude:latitude,
            },
            uuid:id
        };
        if (address) {
            obj.location.address = address;
        }
        
        var content = JSON.stringify(obj);
        var sender = this.props.sender;
        var receiver = this.props.receiver;
        var now = this.getNow();
        var message = {
            id:0,
            _id:0,
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

        var p = this.saveMessage(message);
        p.then((rowid)=> {
            console.log("row id:", rowid);
            message.id = rowid;
            message._id = rowid;

            this.addMessage(message, true);
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
        const options:any = {
            maxWidth:1024,
            storageOptions: {
                skipBackup: true,
                path: 'images'
            },
        }
        ImagePicker.launchImageLibrary(options, (response) => {
            console.log('Response = ', response);

            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.errorCode) {
                console.log('ImagePicker Error: ', response.errorCode);
            }  else {
                this.sendImageMessage(response)
            }
        });
    }

    handleCameraPicker() {
        const options:any = {
            maxWidth:1024,
            storageOptions: {
                skipBackup: true,
                path: 'images'
            },
            mediaType:"photo"
        }
        
        // Launch Camera:
        ImagePicker.launchCamera(options, (response) => {
            console.log('Response = ', response);

            if (response.didCancel) {
                console.log('User cancelled image picker');
            }
            else if (response.errorCode) {
                console.log('ImagePicker Error: ', response.errorCode);
            }
            else {
                this.sendImageMessage(response);
            }
        });
    }

    onLocation(coordinate) {
        this.sendLocationImage(coordinate.longitude,
                               coordinate.latitude,
                               coordinate.address);
    }

    handleLocationClick() {
        console.log("locaiton click");
        // var navigator = this.props.navigator;

        // navigator.push({
        //     title:"位置",
        //     screen:"chat.LocationPicker",
        //     passProps:{
        //         onLocation:this.onLocation.bind(this),
        //     },
        //     navigatorStyle:{
        //         tabBarHidden:true
        //     },
        //     navigatorStyle: {
        //         statusBarHideWithNavBar:true,
        //         statusBarHidden:true,
        //     },
        // });
    }

    onMessageLongPress(message) {
        console.log("on message long press:", message);
        // if (message.text) {
        //     const options = [
        //         'Copy Text',
        //         'Cancel',
        //     ];
        //     const cancelButtonIndex = options.length - 1;
        //     this._actionSheetRef.showActionSheetWithOptions({
        //         options,
        //         cancelButtonIndex,
        //     }, (buttonIndex) => {
        //         switch (buttonIndex) {
        //             case 0:
        //                 Clipboard.setString(message.text);
        //                 break;
        //         }
        //     });
        // }
    }

    stopPlayer() {
        if (this.player) {
            var msgID = this.playingMessage.id;
            this.player.stop();
            this.player.release();
            this.player = null;
            this.playingMessage = null;
            clearInterval(this.playingTimer);
            //this.props.dispatch(playMessage(msgID, false));
        }
    }
    
    onMessageListPress() {
        Keyboard.dismiss();
    }

    onMessagePress(message) {
        console.log("on message press:", message);
        Keyboard.dismiss();
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
     
                    this.setMessageListened(message);
                    this.playingTimer = setInterval(function() {
                        self.setMessagePlaying(msgID, true);
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
            // var navigator = this.props.navigator;

            // if (Platform.OS === 'android') {
            //     navigator.push({
            //         screen:"chat.Photo",
            //         passProps:{
            //             url:message.image.url
            //         },
            //         navigatorStyle:{
            //             tabBarHidden:true
            //         },
            //         navigatorStyle: {
            //             statusBarHideWithNavBar:true,
            //             statusBarHidden:true,
            //         },
            //     });
            // } else {
            //     navigator.showLightBox({
            //         screen:"chat.Photo",
            //         passProps:{
            //             url:message.image.url
            //         },
            //         navigatorStyle: {
            //             statusBarHideWithNavBar:true,
            //             statusBarHidden:true,
            //         },
            //     });
            // }
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
        var audioPath = RNFS.DocumentDirectoryPath + "/" + fileName;
        AudioRecorder.onProgress = function(data) {
            console.log("record progress:", data);
            if (Platform.OS == 'ios') {
                var metering = data.currentMetering;
              
                //ios: [-160, 0]
                metering = Math.max(metering, -160);
                metering = Math.min(metering, 0);

                //to [0, 20]
                var t = 20*(metering - (-160))/160;
                t = Math.floor(t);
                self.setState({currentMetering:t});
            } else {
                var metering;
                if (data.currentMetering) {
                    metering = data.currentMetering;
                } else {
                    metering = 0;
                }
                metering = metering/7000.0;
                metering = Math.max(metering, 0);
                metering = Math.min(metering, 1);
                
                //to [0, 20]
                var t = 20*metering;
                t = Math.floor(t);
                self.setState({currentMetering:t});
            }
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
            //Toast.showShortBottom('录音时间太短了')
            return;
        }
        var self = this;
        var id = UUID.v1();

        var fileName = Platform.select({
            ios: "recording.wav",
            android: "recording.amr",
        });
        var audioPath = RNFS.DocumentDirectoryPath + "/" + fileName;
        if (Platform.OS == 'android') {
            var path = RNFS.DocumentDirectoryPath + "/audios";
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
            var path = RNFS.DocumentDirectoryPath + "/audios";
            var wavPath = path + "/" + id + ".wav";
            var amrPath = path + "/" + id;
            RNFS.mkdir(path)
                .then(() => {
                    console.log("move file");
                    return RNFS.moveFile(audioPath, wavPath);
                })
                .then(() => {
                    return new Promise<void>((resolve, reject) => {
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
            // var animation = LayoutAnimation.create(
            //     e.duration,
            //     LayoutAnimation.Types[e.easing],
            //     LayoutAnimation.Properties.opacity);

            var animation = LayoutAnimation.create(
                e.duration,
                LayoutAnimation.Types[e.easing]);

            LayoutAnimation.configureNext(animation);
        }
        this.setState({
            messagesContainerHeight:new Animated.Value(newMessagesContainerHeight)
        });
        this.scrollToBottom();
    }

    onKeyboardWillHide(e) {
        this.setKeyboardHeight(0);
        var newMessagesContainerHeight = this.getMaxHeight() - this.inputToolbar.getToolbarHeight() - this.getKeyboardHeight();

        console.log("keyboard will hide:", e, newMessagesContainerHeight, this.getMaxHeight(), this.inputToolbar.getToolbarHeight(), this.getKeyboardHeight());

        if (e && e.duration && e.duration > 0) {
            var animation = LayoutAnimation.create(
                e.duration,
                LayoutAnimation.Types[e.easing]);
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
        if (MESSAGE_LIST_INVERTED) {
            this.listRef.scrollToOffset({offset:0, animated:true});
//            this.listRef.scrollToIndex({index:0, animated:true});
        } else {
            this.listRef.scrollToEnd({animated:true});
        }
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
            // LayoutAnimation.Types.linear,
            // LayoutAnimation.Properties.opacity
        ));
        
        this.setState({
            messagesContainerHeight:new Animated.Value(newMessagesContainerHeight)
        });
    }
    
    saveMessage(message) {
        console.log("save message not implement");        
        return Promise.resolve(message);
    }
    
    updateMessageAttachment(msgID, attachment) {
        console.log("save message attachment not implement");
    }
    
    setMessagePlaying(msgID,  playing) {
        var messages = this.state.messages;
        var index = messages.findIndex((m) => {
            return m.id == msgID;
        });
        if (index == -1) {
            return;
        }

        var p = messages[index].playing ? messages[index].playing : 0;
        if (playing) {
            p += 1;
        } else {
            p = 0;
        }
        messages[index].playing = p;

        this.setState({});
          
    }

    setMessageListened(message) {
        console.log("setMessageListened not implement");
        var messages = this.state.messages;
        var index = messages.findIndex((m) => {
            return m.id == message.id;
        });
        if (index == -1) {
            return;
        }
        var f = messages[index].flags;
        f = f | MESSAGE_FLAG_LISTENED;
        this.setState({});
    }

    setMessageFailure(message) {
        console.log("setMessageFailure not implement");
    }
    
    sendMessage(message) {
        console.log("send message not implement");
    }

    loadMoreContentAsync() {
        console.log("loadMoreContentAsync not implement");
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
            position = message.user._id === this.props.sender ? 'right' : 'left';
        }
        
        const messageProps = {
            onMessageLongPress:this.onMessageLongPress,
            onMessagePress:this.onMessagePress,
            onPress:this.onMessageListPress,
            key: message._id,
            currentMessage: message,
            previousMessage: message.previousMessage,
            nextMessage: message.nextMessage,
            position: position,
            user:{
                _id: this.props.sender, 
            }
        };
        return <Message {...messageProps}/>;
    }

    renderMessages() {
        var props = {}
        if (!MESSAGE_LIST_INVERTED) {
            props = {
                refreshing: MESSAGE_LIST_INVERTED ? false : this.state.loading,
                onRefresh:() => {
                    if (!MESSAGE_LIST_INVERTED) {
                        this.loadMoreContentAsync();
                    }
                }
            }
        } else {
            props = {
                onEndReached:(info) => {
                    console.log("on end reached:", info);
                    if (MESSAGE_LIST_INVERTED) {
                        this.loadMoreContentAsync();
                    }
                },
                onEndReachedThreshold:0.2,
            }
        }
        return (
            <Animated.View style={{height: this.state.messagesContainerHeight }}>
                <View style={{flex:1}}>
                    <FlatList
                            ref={(ref) => {this.listRef=ref}}
                            keyboardShouldPersistTaps="always"
                            automaticallyAdjustContentInsets={false}
                            inverted={MESSAGE_LIST_INVERTED}
                            data={this.state.messages}
                            renderItem={this.renderRow}
                            keyExtractor={(item, index) => {return "" + item.id}}
                            {...props}
                        />
                </View>
            </Animated.View>
        );
    }

    renderInputToolbar() {
        return (
            <InputToolbar
                ref={(input) => this.inputToolbar = input}
                onSend={this.onSend}
                onHeightChange={this.onInputToolbarHeightChange}
            />
        );
    }


    renderRecordView() {
        var images = [
            require("../chat/Images/VoiceSearchFeedback000.png"),
            require("../chat/Images/VoiceSearchFeedback001.png"),
            require("../chat/Images/VoiceSearchFeedback002.png"),
            require("../chat/Images/VoiceSearchFeedback003.png"),
            require("../chat/Images/VoiceSearchFeedback004.png"),
            require("../chat/Images/VoiceSearchFeedback005.png"),
            require("../chat/Images/VoiceSearchFeedback006.png"),
            require("../chat/Images/VoiceSearchFeedback007.png"),
            require("../chat/Images/VoiceSearchFeedback008.png"),
            require("../chat/Images/VoiceSearchFeedback009.png"),
            require("../chat/Images/VoiceSearchFeedback010.png"),
            require("../chat/Images/VoiceSearchFeedback011.png"),
            require("../chat/Images/VoiceSearchFeedback012.png"),
            require("../chat/Images/VoiceSearchFeedback013.png"),
            require("../chat/Images/VoiceSearchFeedback014.png"),
            require("../chat/Images/VoiceSearchFeedback015.png"),
            require("../chat/Images/VoiceSearchFeedback016.png"),
            require("../chat/Images/VoiceSearchFeedback017.png"),
            require("../chat/Images/VoiceSearchFeedback018.png"),
            require("../chat/Images/VoiceSearchFeedback019.png"),
            require("../chat/Images/VoiceSearchFeedback020.png"),
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
                <View style={{flex:1}}>
                    <View
                        style={{marginTop:NAVIGATIONBAR_HEIGHT, flex:1, backgroundColor:"white"}}
                        onLayout={onViewLayout}>
                        {this.renderMessages()}
                        {this.renderRecordView()}
                        {this.renderInputToolbar()}
                    </View>
                </View>
            );

            // return (
            //     <ActionSheet ref={component => this._actionSheetRef = component}>
            //         <View
            //             style={{marginTop:NAVIGATIONBAR_HEIGHT, flex:1, backgroundColor:"white"}}
            //             onLayout={onViewLayout}>
            //             {this.renderMessages()}
            //             {this.renderRecordView()}
            //             {this.renderInputToolbar()}
            //         </View>
            //     </ActionSheet>
            // );
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



