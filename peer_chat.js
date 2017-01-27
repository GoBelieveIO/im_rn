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

import InputToolbar, {MIN_INPUT_TOOLBAR_HEIGHT} from './gifted-chat/InputToolbar';
import LoadEarlier from './gifted-chat/LoadEarlier';
import MessageContainer from './gifted-chat/MessageContainer';

import PeerMessageDB from './PeerMessageDB.js'
import {setMessages, addMessage, ackMessage} from './actions'

var IMService = require("./im");


const API_URL = "http://api.gobelieve.io";

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
        this._inputToolbarHeight = MIN_INPUT_TOOLBAR_HEIGHT;
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
        this._isMounted = true;
        var im = IMService.instance;
        im.addObserver(this);

        this.listener = RCTDeviceEventEmitter.addListener('peer_message',
                                                          (message)=>{
                                                              this.downloadAudio(message);
                                                              this.props.dispatch(addMessage(message));
                                                              this.scrollToBottom();
                                                          });
        
        var db = PeerMessageDB.getInstance();
        db.getMessages(this.props.receiver,
                       (msgs)=>{
                           for (var i in msgs) {
                               var m = msgs[i];
                               var obj = JSON.parse(m.content);
                               var t = new Date();
                               t.setTime(m.timestamp*1000);

                               m._id = m.id;

                               console.log("obj:", obj);
                               if (obj.text) {
                                   m.text = obj.text;
                               } else if (obj.image2) {
                                   if (obj.image2.fileName) {
                                       if (Platform.OS === 'ios') {
                                           var uri = AudioUtils.DocumentDirectoryPath + "/images/" + obj.image2.fileName;
                                           obj.image2.url = uri;
                                           console.log("image uri:", uri);
                                       }
                                   }
                                   m.image = obj.image2
                               } else if (obj.audio) {
                                   console.log("auido message....");
                                   m.audio = obj.audio;
                               } else if (obj.location) {
                                   m.location = obj.location;
                               }
                               m.uuid = obj.uuid;
                               
                               m.createdAt = t;
                               m.user = {
                                   _id:m.sender
                               };


                               this.downloadAudio(m);
                           }
                           console.log("set messages:", msgs.length);
                           this.props.dispatch(setMessages(msgs));
                       },
                       (e)=>{});
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
        var im = IMService.instance;
        im.removeObserver(this);

        this.listener.remove();
        this._isMounted = false;
    }

    downloadAudio(message) {
        if (!message.audio) {
            return;
        }
        if (!message.uuid) {
            return;
        }

        var amrPath = this.getAMRPath(message.uuid);
        var wavPath = this.getWAVPath(message.uuid);

        RNFS.exists(wavPath)
            .then((exists) =>  {
                if (exists) {
                    return;
                }
                if (!message.audio.url) {
                    return;
                }
                console.log("audio url:", message.audio.url);
                var r = RNFS.downloadFile({
                    fromUrl:message.audio.url,
                    toFile:amrPath
                });

                
                r.promise.then((result) => {
                    console.log("download result:", result);
                    if (result.statusCode == 200) {
                        OpenCoreAMR.amr2WAV(amrPath, wavPath, function(err) {
                            if (err) {
                                console.log("amr 2 wav err:", err);
                            }
                        });
                    }
                });
            });
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

    uploadAudio(filePath) {
        var url = API_URL + "/v2/audios";
        var formData = new FormData();
        console.log("uri:", filePath);

        var s = filePath.split("/");
        if (s.length == 0) {
            return;
        }

        var fileName = s[s.length-1];
        formData.append('file', {uri: filePath, name:fileName});
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
                    Promise.reject(respJson);
                    return;
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

            audio: obj.audio,
            createdAt: new Date(),
            user: {
                _id: this.props.sender
            }
        };

        var self = this;
        var db = PeerMessageDB.getInstance();
        var p = new Promise((resolve, reject) => {
            db.insertMessage(message, this.props.receiver,
                             function(rowid) {
                                 console.log("row id:", rowid);
                                 resolve(rowid);
                             },
                             function(err) {
                                 reject(err);
                             });
            
        });
        p.then((rowid) => {
            message.id = rowid;
            message._id = rowid;

            self.props.dispatch(addMessage(message));
            self.scrollToBottom();

            return this.uploadAudio(amrPath);
            
        }).then((url)=> {
            console.log("audio url:", url);
            var obj = {audio: {url:url, duration:duration}, uuid:id};
            var content = JSON.stringify(obj);
            message.content = content;

            var im = IMService.instance;
            if (im.connectState == IMService.STATE_CONNECTED) {
                im.sendPeerMessage(message);
            }
            message.content = content;
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
            
            text: text,
            createdAt: new Date(),
            user: {
                _id: this.props.sender
            }
        };

        var self = this;
        var db = PeerMessageDB.getInstance();
        db.insertMessage(message, this.props.receiver,
                         function(rowid) {
                             console.log("row id:", rowid);
                             message.id = rowid;
                             message._id = rowid;
                          
                             self.props.dispatch(addMessage(message));
                             self.setState({
                                 value: '',
                             });
                             self.scrollToBottom();
                             var im = IMService.instance;
                             if (im.connectState == IMService.STATE_CONNECTED) {
                                 im.sendPeerMessage(message);
                             }
                         },
                         function(err) {
                                                      
                         });
    }


    uploadImage(uri, fileName) {
        var url = API_URL + "/v2/images";
        var formData = new FormData();
        console.log("uri:", uri);
        formData.append('file', {uri: uri, name:fileName});
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
            var imagePath = AudioUtils.DocumentDirectoryPath + "/images/";
            fileName = uri.substr(imagePath.length);
            console.log("fileName:", fileName);
        } else {
            uri = image.uri;
            fileName = "";
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

            image: obj.image2,
            createdAt: new Date(),
            user: {
                _id: this.props.sender
            }
        };

        var self = this;
        var db = PeerMessageDB.getInstance();

        var p = new Promise((resolve, reject) => {
            db.insertMessage(message, this.props.receiver,
                             function(rowid) {
                                 console.log("row id:", rowid);
                                 resolve(rowid);
                             },
                             function(err) {
                                 reject(err);
                             });
            
        });
        p.then((rowid) => {
            message.id = rowid;
            message._id = rowid;

            self.props.dispatch(addMessage(message));
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
            var im = IMService.instance;
            im.sendPeerMessage(message);

            //todo save url
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
            
            location: obj.location,
            createdAt: new Date(),
            user: {
                _id: this.props.sender
            }
        };
        
        var self = this;
        var db = PeerMessageDB.getInstance();
        db.insertMessage(message, this.props.receiver,
                         function(rowid) {
                             console.log("row id:", rowid);
                             message.id = rowid;
                             message._id = rowid;

                             self.props.dispatch(addMessage(message));
                             self.scrollToBottom();
                         },
                         function(err) {

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
            }
            else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            }
            else if (response.customButton) {
                console.log('User tapped custom button: ', response.customButton);
            }
            else {
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

    
    onMessagePress(message) {
        console.log("on message press:", message);
        if (message.audio && message.uuid) {

            //停止正在播放的消息
            if (this.player && this.playingMessage.id == message.id) {
                this.player.stop();
                this.player.release();
                this.player = null;
                this.playingMessage = null;
                return;
            }
            
            var wavFile = this.getWAVPath(message.uuid);
            RNFS.exists(wavFile)
                .then((exists) =>  {
                    if (!exists) {
                        return Promise.reject("wav file non exists");
                    }

                    if (this.player) {
                        this.player.stop();
                        this.player.release();
                        this.player = null;
                        this.playingMessage = null;
                    }
                    
                    console.log("playing message...:", wavFile);

                    return new Promise((resolve, reject) => {
                        var player = new Sound(wavFile, null);
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
                    this.playingMessage = message;
                    this.player = player
                    this.player.play((success)=> {
                        console.log("play:", message.audio.file + ".wav",
                                    "result:", success);
                        
                        this.player.release();
                        this.player = null;
                        this.playingMessage = null;
                    });
                })
                .catch((err) => {
                    console.log("error:", err);
                });
        }
    }
    
    startRecording() {
        if (this.player) {
            this.player.stop();
            this.player.release();
            this.player = null;
            this.playingMessage = null;
        }
        
        this.recordingBegin = new Date();
        var audioPath = AudioUtils.DocumentDirectoryPath + "/recording.wav";
        AudioRecorder.prepareRecordingAtPath(audioPath, {
            SampleRate: 8000,
            Channels: 2,
            AudioEncoding: "lpcm",
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
            Toast.showLongBottom.bind(null, '录音时间太短了')
            return;
        }

        
        var self = this;
        var id = UUID.v1();
        var audioPath = AudioUtils.DocumentDirectoryPath + "/recording.wav";
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
        var newMessagesContainerHeight = this.getMaxHeight() - this._inputToolbarHeight - this.getKeyboardHeight();
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
        this.setKeyboardHeight(0);
        var newMessagesContainerHeight = this.getMaxHeight() - this._inputToolbarHeight - this.getKeyboardHeight();
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
        this._inputToolbarHeight = h;
        const newMessagesContainerHeight = this.getMaxHeight() - this._inputToolbarHeight - this.getKeyboardHeight();
        this.setState((previousState) => {
            return {
                messagesContainerHeight: newMessagesContainerHeight,
            };
        });
        
    }

    renderMessages() {
        console.log("message containser height:", this.state.messagesContainerHeight);
        const AnimatedView = this.props.isAnimated === true ? Animated.View : View;
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

                    onMessageLongPress={this.onMessageLongPress.bind(this)}
                    onMessagePress={this.onMessagePress.bind(this)}
                    messages={this.props.messages}

                    ref={component => this._messageContainerRef = component}
                />
            </AnimatedView>
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
                        messagesContainerHeight: (this.getMaxHeight() - MIN_INPUT_TOOLBAR_HEIGHT)
                    });
                });
            }}>
            </View>
        );
    }

    
}


PeerChat.childContextTypes = {
    actionSheet: React.PropTypes.func,
    getLocale: React.PropTypes.func,
};


PeerChat = connect(function(state){
    return {messages:state.messages};
})(PeerChat);

export default PeerChat;
