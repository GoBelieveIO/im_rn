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
        
        var playing;
        if (this.props.currentMessage.playing == undefined) {
            playing = 0;
        } else {
            playing = this.props.currentMessage.playing;
        }
        
        console.log("playing:", playing);
        
        var outgoing = (this.props.user._id == this.props.currentMessage.user._id);        
        if (playing == 0) {
            image = outgoing ? require("./Images/SenderVoiceNodePlaying.png") :
                    require("./Images/ReceiverVoiceNodePlaying.png");
        } else if (playing > 0) {
            playing = playing % 4;
            var image = outgoing ? sendImages[playing] : recvImages[playing];
        }
        return (
            <View style={styles.container}>
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

