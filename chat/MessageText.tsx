import React from 'react';
import {
  Linking,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import PropTypes from 'prop-types';
import ParsedText from 'react-native-parsed-text';
import Communications from 'react-native-communications';

import {Message as IMessage} from "../model/IMessage";

interface Props {
  position:string;
  currentMessage:IMessage;

}
export default class MessageText extends React.Component<Props, {}> {
  constructor(props) {
    super(props);
    this.onUrlPress = this.onUrlPress.bind(this);
    this.onPhonePress = this.onPhonePress.bind(this);
    this.onEmailPress = this.onEmailPress.bind(this);
  }

  onUrlPress(url) {
    Linking.openURL(url);
  }

  onPhonePress(phone) {
    // const options = [
    //   'Text',
    //   'Call',
    //   'Cancel',
    // ];
    // const cancelButtonIndex = options.length - 1;
    // this.context.actionSheet().showActionSheetWithOptions({
    //   options,
    //   cancelButtonIndex,
    // },
    // (buttonIndex) => {
    //   switch (buttonIndex) {
    //     case 0:
    //       Communications.phonecall(phone, true);
    //       break;
    //     case 1:
    //       Communications.text(phone);
    //       break;
    //   }
    // });
  }

  onEmailPress(email) {
    Communications.email(email, null, null, null, null);
  }

  render() {
    return (
      <View style={[styles[this.props.position].container]}>
        <ParsedText
          style={[styles[this.props.position].text]}
          parse={[
            {type: 'url', style: StyleSheet.flatten([styles[this.props.position].link]), onPress: this.onUrlPress},
            {type: 'phone', style: StyleSheet.flatten([styles[this.props.position].link]), onPress: this.onPhonePress},
            {type: 'email', style: StyleSheet.flatten([styles[this.props.position].link]), onPress: this.onEmailPress},
          ]}
        >
          {this.props.currentMessage.contentObj.text}
        </ParsedText>
      </View>
    );
  }
}

const textStyle = {
  fontSize: 16,
  lineHeight: 20,
  marginTop: 5,
  marginBottom: 5,
  marginLeft: 10,
  marginRight: 10,
};

const styles = {
  left: StyleSheet.create({
    container: {
    },
    text: {
      color: 'black',
      ...textStyle,
    },
    link: {
      color: 'black',
      textDecorationLine: 'underline',
    },
  }),
  right: StyleSheet.create({
    container: {
    },
    text: {
      color: 'white',
      ...textStyle,
    },
    link: {
      color: 'white',
      textDecorationLine: 'underline',
    },
  }),
};

// MessageText.contextTypes = {
//   actionSheet: PropTypes.func,
// };


