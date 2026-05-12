const PROD_BASE_URL = 'https://sterile-sherry-april.ngrok-free.dev/api';
const DEV_BASE_URL = 'http://192.168.1.104:3000/api';

const config = {
  BASE_URL1: __DEV__ ? DEV_BASE_URL : PROD_BASE_URL,
  // BASE_URL1: DEV_BASE_URL,
  GOOGLE_MAPS_API_KEY: 'AIzaSyDKpfDr07ynPbVVkdeWg-3Cs9yH-rMQApE',
};

export default config;

