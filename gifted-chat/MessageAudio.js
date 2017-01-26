import React from 'react';
import {
    StyleSheet,
    Image,
    View,
} from 'react-native';

export default class MessageAudio extends React.Component {
    render() {

        console.log("audio uid:", this.props.user._id);

        var outgoing = (this.props.user._id == this.props.currentMessage.user._id);
        return (
            <View style={styles.container}>
                <Image style={{width:20, height:20}}
                       source={outgoing ? require("../Images/SenderVoiceNodePlaying.png") :require("../Images/ReceiverVoiceNodePlaying.png")}>
                </Image>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        width:100
    },
});

