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

import {Colors, Metrics, Fonts} from './Themes'

//import Styles from './Styles/MessageScreenStyle'

//输入框初始高度
const MIN_COMPOSER_HEIGHT = Platform.select({
    ios: 33,
    android: 41,
});
const MAX_COMPOSER_HEIGHT = 100;

export const MIN_INPUT_TOOLBAR_HEIGHT = Platform.select({
    ios: 44,
    android: 54,
});


interface Stat {
    value:string;
    focused:boolean;
}

export default class TextInputToolbar extends React.Component<{onSend, onHeightChange}, Stat> {
    composerHeight:number;
    search:any;

    constructor(props) {
        super(props);
        this.state = {
            focused: false,
            value: '',
        };
        this.composerHeight = MIN_COMPOSER_HEIGHT;
    }


    getToolbarHeight() {
        var h = this.composerHeight + (MIN_INPUT_TOOLBAR_HEIGHT - MIN_COMPOSER_HEIGHT);
        return h;
    }
    
    dismiss() {

    }
    
    handleSend() {
        this.props.onSend(this.state.value);
        if (this.composerHeight != MIN_COMPOSER_HEIGHT) {
            this.composerHeight = MIN_COMPOSER_HEIGHT;
            this.onHeightChange();
        }
        this.setState({value: ''});
    }


    handleFocusSearch() {
        this.setState({
            focused: true,
        })
    }

    handleBlurSearch() {
        this.setState({focused: false});
    }

    
    handleChangeText(v) {
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


    onHeightChange() {
        var h = this.composerHeight + (MIN_INPUT_TOOLBAR_HEIGHT - MIN_COMPOSER_HEIGHT);
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
        var value = this.state.value;
        var height = this.composerHeight + (MIN_INPUT_TOOLBAR_HEIGHT - MIN_COMPOSER_HEIGHT);
        return (
            <View style={[styles.inputRow, {height:height}]}>
                <View style={styles.searchRow}>
                    <TextInput
                        ref={(search)=> {this.search = search} }
                        style={[styles.searchInput, {height: this.composerHeight}]}
                        value={value}
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
            </View>
        );
    }
    
    render() {
        return (
            <View style={styles.search}>
                {this.renderTextInput()}
                <View style={{flexGrow:1, height:1, backgroundColor:"lightgray"}}/>
            </View>
        )
    }
}



const styles = StyleSheet.create({
    search: {
        //marginTop: 5,
        flexDirection: 'column',
        //paddingTop: 10,
        backgroundColor: Colors.white1,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.coolGrey50
    },
    inputRow: {
        flexDirection: 'row',
        backgroundColor: Colors.white1,
        justifyContent: 'center',
        alignItems:"center",
    },
   
    searchRow: {
        flex: 1,
        flexDirection: 'column',        
        backgroundColor: Colors.snow,
        justifyContent: 'center',
        marginLeft:4,
    },
    
    searchInput: {
        borderRadius: 3,
        fontSize: 13,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.coolGrey190
    },
});