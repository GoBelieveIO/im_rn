import React from 'react';
import {
    Image,
    View,
    Linking,
    Platform,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';

import MapView, {Marker} from 'react-native-maps';

import {Message as IMessage} from "../model/IMessage";

export default class MessageLocation extends React.Component<{currentMessage:IMessage}, {}> {
    render() {
        var location = this.props.currentMessage.contentObj.location;
        var region = {
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.0422,
            longitudeDelta: 0.0221,
        };

        return (
            <TouchableOpacity style={styles.container} onPress={() => {
                    const url = Platform.select({
                        ios: `http://maps.apple.com/?ll=${location.latitude},${location.longitude}`,
                        android: `http://maps.google.com/?q=${location.latitude},${location.longitude}`
                    });
                    Linking.canOpenURL(url).then(supported => {
                        if (supported) {
                            return Linking.openURL(url);
                        }
                    }).catch(err => {
                        console.error('An error occurred', err);
                    });
                }}>
                <MapView
                    style={styles.mapView}
                    region={region}
                    scrollEnabled={false}
                    zoomEnabled={false}>
                    <Marker coordinate={region}/>
                </MapView>
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
        margin: 3,
    },
});


