import React from 'react';
import {
  Image,
  StyleSheet,
  View,
} from 'react-native';
import {Message as IMessage} from "../model/IMessage";

export default class MessageImage extends React.Component<{currentMessage:IMessage}, {}> {
  render() {
    return (
      <View style={[styles.container]}>
        <Image
          style={[styles.image]}
          source={{uri: this.props.currentMessage.contentObj.image2.url}}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
  },
  image: {
    width: 150,
    height: 100,
    borderRadius: 13,
    margin: 3,
    resizeMode: 'cover',
  },
});
