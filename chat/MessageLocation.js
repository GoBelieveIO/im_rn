import React from 'react';
import {
    Image,
    View,
    Linking,
    Platform,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';

import MapView from 'react-native-maps';

export default class MessageLocation extends React.Component {
    render() {
        var region = {
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
        };
        
        return (
            <TouchableOpacity style={styles.container} onPress={() => {
                    const url = Platform.select({
                        ios: `http://maps.apple.com/?ll=${this.props.currentMessage.location.latitude},${this.props.currentMessage.location.longitude}`,
                        android: `http://maps.google.com/?q=${this.props.currentMessage.location.latitude},${this.props.currentMessage.location.longitude}`
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
                    zoomEnabled={false}
                />
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


