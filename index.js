/**
 * @format
 */

import 'react-native-get-random-values'; // Must be first for uuid
import 'react-native-url-polyfill/auto'; // Required for Supabase
import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
