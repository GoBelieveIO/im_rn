import React from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    View,
    Dimensions,
    TextInput,
    Image,
    ActivityIndicator,
    Keyboard,
    LayoutAnimation,
    TouchableOpacity,
    TouchableWithoutFeedback,
    InteractionManager,
    Clipboard,
    Easing,
    UIManager,
    Animated
} from 'react-native';

import MapView from 'react-native-maps';
export default class LocationPicker extends React.Component {
    static navigatorButtons = {
        rightButtons: [
            {
                title: '发送', 
                id: 'send', 
                showAsAction: 'ifRoom' 
            },
        ]
    };

    static navigatorStyle = {
        navBarBackgroundColor: '#4dbce9',
        navBarTextColor: '#ffff00',
        navBarSubtitleTextColor: '#ff0000',
        navBarButtonColor: '#ffffff',
        statusBarTextColorScheme: 'light',
    };
    
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
        };
        this.props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
    }

    handleSend() {
        if (!this.state.region) {
            return;
        }
        var coords = {
            longitude:this.state.region.longitude,
            latitude:this.state.region.latitude
        };

        this.props.onLocation(coords);
        this.props.navigator.pop();
    }
    
    onNavigatorEvent(event) {
        if (event.type == 'NavBarButtonPress') { 
            if (event.id == 'send') {
                this.handleSend();
            }     
        }
    }
    
    componentWillMount() {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log("current postion:",
                            position.coords.longitude,
                            position.coords.latitude);

                this.setState({
                    region: {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    },
                    loading:false,
                })
            },
            (error) => alert(error.message),
            {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
        );
    }
    
    onRegionChange(region) {
        console.log("region postion:",
                    region.longitude,
                    region.latitude);
        this.setState({ region });
    }

    onRegionChangeComplete(region) {
        console.log("region change complete:",
                    region.longitude,
                    region.latitude);
        this.setState({ region });
    }
    
    render() {
        var region = this.state.region;
        if (this.state.loading) {
            return (
                <View  style={{flex:1,
                               alignItems: 'center',
                               justifyContent: 'center'}}>
                    <ActivityIndicator
                        animating={true}
                        size="large"/>
                </View>
            );
        } else {
            console.log("render region:",
                        region.longitude,
                        region.latitude);
            return (
                <MapView
                    style={{flex:1}}
                    initialRegion={this.state.region}
                    loadingEnabled={true}
                    onRegionChange={this.onRegionChange.bind(this)}
                    onRegionChangeComplete={this.onRegionChangeComplete.bind(this)}>
                    <MapView.Marker coordinate={this.state.region}/>
                </MapView>
            );
        }
    }
}

