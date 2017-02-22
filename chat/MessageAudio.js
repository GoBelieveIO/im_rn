import React from 'react';
import {
    StyleSheet,
    Image,
    View,
} from 'react-native';

export default class MessageAudio extends React.Component {
    render() {
        var sendImages = [
            require('./Images/SenderVoiceNodePlaying000.png'),
            require('./Images/SenderVoiceNodePlaying001.png'),
            require('./Images/SenderVoiceNodePlaying002.png'),
            require('./Images/SenderVoiceNodePlaying003.png'),
        ];

        var recvImages = [
            require('./Images/ReceiverVoiceNodePlaying000.png'),
            require('./Images/ReceiverVoiceNodePlaying001.png'),
            require('./Images/ReceiverVoiceNodePlaying002.png'),
            require('./Images/ReceiverVoiceNodePlaying003.png'),
        ];

        var msg = this.props.currentMessage;
        var playing;
        if (msg.playing == undefined) {
            playing = 0;
        } else {
            playing = msg.playing;
        }
        
        console.log("playing:", playing);
        
        var outgoing = msg.outgoing;
        if (playing == 0) {
            image = outgoing ? require("./Images/SenderVoiceNodePlaying.png") :
                    require("./Images/ReceiverVoiceNodePlaying.png");
        } else if (playing > 0) {
            playing = playing % 4;
            var image = outgoing ? sendImages[playing] : recvImages[playing];
        }

        //max 180
        var margin = msg.audio.duration*3;
        margin = Math.min(180, margin);
        return (
            <View style={outgoing ? {flex:1, marginRight:margin} : {flex:1, marginLeft:margin, alignItems:"flex-end"}}>
                <Image style={styles.image}
                       source={image}>
                </Image>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
    },
    image: {
        marginTop: 5,
        marginBottom: 5,
        marginLeft: 10,
        marginRight: 10,
        width:20,
        height:20        
    }
});

