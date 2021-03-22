import React from 'react';
import {
    Image,
    View,
    Text,
    Linking,
    Platform,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';

import {Message as IMessage} from "../model/IMessage";

export default class MessageLocation extends React.Component<{currentMessage:IMessage}, {}> {
    render() {
        var region = {
            latitude: this.props.currentMessage.contentObj.location.latitude,
            longitude: this.props.currentMessage.contentObj.location.longitude,
            latitudeDelta: 0.0422,
            longitudeDelta: 0.0221,
        };

        var location = this.props.currentMessage.contentObj.location;
        location.type = 'gcj02';
        //高德，百度地图
        var urls = [
            `androidamap://viewMap?lat=${location.latitude}&lon=${location.longitude}&dev=${location.type === 'gcj02' ? '0' : '1'}`,
            `bdapp://map/marker?location=${location.latitude},${location.longitude}&coord_type=${location.type === 'gcj02' ? 'gcj02' : 'wgs84'}`
        ];


        function onPress() {
            return Promise.all(urls.map(url => Linking.canOpenURL(url)))
                          .then((results) => {
                              for (var i = 0; i < results.length; i++) {
                                  if (results[i]) {
                                      Linking.openURL(urls[i]);
                                      break;
                                  }
                              }
                          });
        }

        var address = location.address || "";
        
        return (
            <TouchableOpacity style={styles.container}
                              onPress={onPress}>
                <Image  style={styles.mapView}
                        source={require("./Images/location.png")}>
                    <Text numberOfLines={2}>
                        {address}
                    </Text>
                </Image>
            </TouchableOpacity>
        );
    }
}



const styles = StyleSheet.create({
    container: {
    },
    mapView: {
        width: 150,
        height: 100,
        borderRadius: 13,
        margin: 1,
        justifyContent:"flex-end",
        alignItems:"center",
    },
});


