import { NativeModules } from 'react-native';
const { NavigatorModule } = NativeModules;

export 

var Navigator = {
    push: function(screen, passProps) {
        NavigatorModule.push(screen, passProps);
    },
    
    pop: function () {
        NavigatorModule.pop();
    },
    
    setTitle: function(title)  {
    
    },
}

export default Navigator;