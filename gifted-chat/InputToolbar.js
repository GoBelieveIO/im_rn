import React from 'react';
import {
    StyleSheet,
    View,
    Platform,
    Text,
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

import Emoji from 'react-native-emoji'
import Swiper from 'react-native-swiper'
import {Images, Colors, Metrics} from '../Themes'
import Styles from '../Styles/MessageScreenStyle'

var spliddit = require('spliddit');
var emoji = require("../emoji");

const MODE_TEXT = "mode_text";
const MODE_RECORD = "mode_record";

//输入框初始高度
const MIN_COMPOSER_HEIGHT = Platform.select({
    ios: 33,
    android: 41,
});
const MAX_COMPOSER_HEIGHT = 100;
export const MIN_INPUT_TOOLBAR_HEIGHT = 44;

const ACTION_BUTTON_HEIGHT = 40;
const EMOJI_HEIGHT = 128;

export default class InputToolbar extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            mode:MODE_TEXT,
            opacity:1.0,
            focused: false,
            isEmoji: false,
            value: '',
            actionVisible: false,            
        };

        this.composerHeight = MIN_COMPOSER_HEIGHT;
    }


    getToolbarHeight() {
        var h = this.composerHeight + (MIN_INPUT_TOOLBAR_HEIGHT - MIN_COMPOSER_HEIGHT) + this.actionBarHeight;
        return h;
    }
    
    dismiss() {
        const {isEmoji, actionVisible} = this.state;
        
        this.setState({
            isEmoji: false,
            actionVisible: false,
        })

        if (isEmoji || actionVisible) {
            this.actionBarHeight = 0;
            this.onHeightChange();
        }
    }
    
    handleSend() {
        this.props.onSend(this.state.value);
        if (this.composerHeight != MIN_COMPOSER_HEIGHT) {
            this.composerHeight = MIN_COMPOSER_HEIGHT;
            this.onHeightChange();
        }
        this.setState({value: ''});
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
            this.actionBarHeight = ACTION_BUTTON_HEIGHT;
            this.onHeightChange();
        }
    }

    handleEmojiOpen() {
        var isEmoji = this.state.isEmoji;
        isEmoji = !isEmoji;
        this.setState({
            isEmoji: isEmoji,
            actionVisible: false,
            mode:MODE_TEXT
        })

        if (isEmoji) {
            if (this.search) {
                this.search.blur();
            }
            this.actionBarHeight = EMOJI_HEIGHT;
            this.onHeightChange();
        } else {
            this.actionBarHeight = 0;
            if (this.search) {
                this.search.focus();
            }
        }
    }

    handleEmojiClick(v) {
        var newValue = (this.state.value || '') + v;
        this.setState({
            value: newValue
        });
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

    handleFocusSearch() {
        this.setState({
            isEmoji: false,
            actionVisible: false,
            focused: true,
        })
    }

    handleBlurSearch() {
        this.setState({focused: false});
    }

    
    handleChangeText(v) {
        console.log("text changed:", v);

        if (v.length > 0 && v[v.length-1] == '\n') {
            this.props.onSend(v);
            if (this.composerHeight != MIN_COMPOSER_HEIGHT) {
                this.composerHeight = MIN_COMPOSER_HEIGHT;
                this.onHeightChange();
            }
            this.setState({value: ''});
        } else {
            this.setState({
                value: v,
            });
        }
    }

    handleImagePicker() {
        this.setState({
            isEmoji: false,
            actionVisible: false
        });

        this.actionBarHeight = 0;
        this.onHeightChange();


        this.props.giftedChat.handleImagePicker();
    }

    handleCameraPicker() {

        this.setState({
            isEmoji: false,
            actionVisible: false
        });

        this.actionBarHeight = 0;
        this.onHeightChange();


        this.props.giftedChat.handleCameraPicker();
    }

    
    handleLocationClick() {
        console.log("locaiton click");

        this.setState({
            isEmoji: false,
            actionVisible: false
        });

        this.actionBarHeight = 0;
        this.onHeightChange();
        
        this.props.giftedChat.handleLocationClick();
    }

    handleRecordMode() {
        if (this.state.mode == MODE_RECORD) {
            return;
        }

        const {isEmoji, actionVisible} = this.state;
        this.setState({isEmoji:false, actionVisible:false, mode:MODE_RECORD});

        if (isEmoji || actionVisible) {
            this.actionBarHeight = 0;
            this.onHeightChange();
        }
    }

    handleTextMode() {
        if (this.state.mode == MODE_TEXT) {
            return;
        }

        this.setState({mode:MODE_TEXT});
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

    onHeightChange() {
        var h = this.composerHeight + (MIN_INPUT_TOOLBAR_HEIGHT - MIN_COMPOSER_HEIGHT) + this.actionBarHeight;
        this.props.onHeightChange(h);
    }
    
    onChange(e) {
        let newComposerHeight = null;
        if (e.nativeEvent && e.nativeEvent.contentSize) {
            newComposerHeight = Math.max(MIN_COMPOSER_HEIGHT, Math.min(MAX_COMPOSER_HEIGHT, e.nativeEvent.contentSize.height));
        } else {
            newComposerHeight = MIN_COMPOSER_HEIGHT;
        }

        if (this.composerHeight != newComposerHeight) {
            this.composerHeight = newComposerHeight;
            this.onHeightChange();
        }
    }
  
    renderTextInput() {
        const {value = '', isEmoji, mode} = this.state;
        var height = this.composerHeight + 11;
        console.log("composer height:", this.composerHeight);
        return (
            <View style={[Styles.inputRow, {height:height}]}>
                <TouchableOpacity style={{alignSelf:"stretch",
                                          justifyContent:"center",
                                          paddingLeft:8}}
                                  onPress={this.handleRecordMode.bind(this)}>
                    <Image style={{width:20, height:20, resizeMode:"stretch"}}
                           source={require("../Images/chatBar_record.png")}/>
                </TouchableOpacity>
                
                <View style={Styles.searchRow}>
                    <TextInput
                        ref={(search)=> {this.search = search} }
                        style={[Styles.searchInput, {height: this.composerHeight}]}
                        value={value}
                        autoFocus={this.state.focused}
                        editable={true}
                        keyboardType='default'
                        returnKeyType='send'
                        autoCapitalize='none'
                        autoCorrect={false}
                        multiline={true}
                        onChange={this.onChange.bind(this)}
                        onFocus={this.handleFocusSearch.bind(this)}
                        onBlur={this.handleBlurSearch.bind(this)}
                        onChangeText={this.handleChangeText.bind(this)}
                        underlineColorAndroid='transparent'
                        placeholder={'输入新消息'}
                    />
                </View>
                { this._renderEmojiButton() }
                { this._renderSendButton() }
            </View>
        );
    }

    

    renderReocrdInput() {
        const {value = '', isEmoji, mode, opacity} = this.state;
        var height = this.composerHeight + 11;
        
        var responder = {
            onStartShouldSetResponder:(evt) => true,
            onMoveShouldSetResponder: (evt) => true,
            onResponderGrant: (evt) => {
                console.log("responder grant");
                this.setState({opacity:0.3});
                this.props.giftedChat.setRecording(true);
                this.props.giftedChat.setRecordingText("手指上滑, 取消发送");
                this.props.giftedChat.setRecordingColor("transparent");
                this.props.giftedChat.startRecording();
            },
            onResponderReject: (evt) => {console.log("responder reject")},
            onResponderMove: (evt) => {
                console.log("responder move");
                console.log("event:", evt.nativeEvent);

                if (evt.nativeEvent.locationY < 0) {
                    this.props.giftedChat.setRecordingText("松开手指, 取消发送");
                    this.props.giftedChat.setRecordingColor("red");                    
                } else {
                    this.props.giftedChat.setRecordingText("手指上滑, 取消发送");
                    this.props.giftedChat.setRecordingColor("transparent");
                }
            },
            onResponderRelease: (evt) => {
                console.log("responder release");
                this.setState({opacity:1.0});
                this.props.giftedChat.setRecording(false);

                var canceled;
                if (evt.nativeEvent.locationY < 0) {
                    canceled = true;
                } else {
                    canceled = false;
                }
                this.props.giftedChat.stopRecording(canceled);
            },
            onResponderTerminationRequest: (evt) => true,
            onResponderTerminate: (evt) => {console.log("responder terminate")},
            
        }
        return (
            <View style={[Styles.inputRow, {height:height}]}>
                <TouchableOpacity style={{alignSelf:"stretch",
                                          justifyContent:"center",
                                          paddingLeft:8}}
                    onPress={this.handleTextMode.bind(this)}>
                    <Image style={{width:20, height:20, resizeMode:"stretch"}}
                           source={require("../Images/chatBar_keyboard.png")}/>
                </TouchableOpacity>
                
                <View style={[Styles.searchRow, {backgroundColor:"gainsboro", opacity:opacity}]}>
                    <View style={{flex:1, alignItems:"center", justifyContent:"center"}}
                          {...responder}>
                        <Text>
                            {"按住说话"}
                        </Text>
                    </View>
                </View>
                { this._renderSendButton() }
            </View>
        );
    }

    _renderEmojiButton() {
        const {isEmoji} = this.state;
        return (
            <TouchableOpacity style={{paddingLeft:5,
                                      paddingRight:5,
                                      alignSelf:"stretch",
                                      justifyContent:"center"}}
                              onPress={this.handleEmojiOpen.bind(this)}>
                {
                    isEmoji ? <Image source={Images.iconEmojiActive}/> : <Image source={Images.iconEmoji}/>
                }
            </TouchableOpacity>
        )
    }
    
    _renderSendButton() {
        const {focused, value} = this.state

        return (focused || value.length > 0) ? (
            <TouchableOpacity style={{alignSelf:"stretch",
                                      justifyContent:"center",
                                      paddingRight:8}}
                              onPress={this.handleSend.bind(this)}>
                <Text style={Styles.sendText}>{'send'}</Text>
            </TouchableOpacity>

        ) : (
            <TouchableOpacity
                style={{alignSelf:"stretch",
                        justifyContent:"center",
                        paddingRight:8}}
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
        );
    }

    
    render() {
        var inputToolbarProps = this.props;
        
        const {value = '', isEmoji, mode} = this.state

        var height = this.composerHeight + 11;
        console.log("render input tool bar composer height:", this.composerHeight);
        return (
            <View style={Styles.search}>
                {mode == MODE_TEXT ? this.renderTextInput() : this.renderReocrdInput()}
                {isEmoji ? this._renderEmoji() : this._renderActions()}
            </View>
        )
    }
}


