// @flow

import {StyleSheet, PixelRatio} from 'react-native'
import {Colors, Metrics, Fonts} from '../Themes'
import {create} from './PlatformStyleSheet'

export default create({
    container: {
        flexDirection: 'column',
    },
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
    iconRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 4,
        paddingBottom: 2,
        paddingHorizontal: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.coolGrey50,
    },
    iconTouch: {
        padding: 8,
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
    searchIcon: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    searchFocus: {
        flex: 0,
        width: 20,
        alignItems: 'center'
    },
    searchExtra: {
        marginLeft: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchPlus: {
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendText: {
        ...Fonts.rowText,
        color: Colors.textRed,
        textAlign: 'center'
    },
    emojiRow: {
        backgroundColor: Colors.emojiBackground,
    },
    wrapper: {
        backgroundColor: Colors.emojiBackground,
    },
    slide: {
        height: 120,
        paddingTop: 5,
        paddingHorizontal: 11,
        justifyContent: 'flex-start',
        flexDirection: 'column',
        flexWrap: 'wrap'
    },
    slideRow: {
        flex: 1,
        justifyContent: 'space-between',
        flexDirection: 'row',
        height: 30,
    },
    sendRow: {
        justifyContent: 'flex-end',
        flexDirection: 'row'
    },
    emoji: {
        // flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 30,
        paddingLeft: 4,
        paddingBottom: 1,
        // height: 30
        color: '#fff'
    },
    send: {
        marginRight: 12,
        paddingVertical: 8,
        width: 50,
    }
})
