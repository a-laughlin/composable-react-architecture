/* eslint-disable no-unused-vars */
import {App} from './components';
import {render} from 'react-dom';
import {createStore,combineReducers,compose,applyMiddleware} from 'redux';
import React from 'react';
import {apolloClient} from './api';
import {ApolloProvider} from 'react-apollo';
import {getReduxReducer,setStateReader,setStateDispatcher} from './hoc-utils';
import registerServiceWorker from './registerServiceWorker';
import './reset.css';
registerServiceWorker(); // from create-react-app, for re-load performance


const reduxReducer = getReduxReducer({
  initialState:{
    norrisContent:'More Norris!',
    filmYearsSelected:[],
    filmGenresSelected:[],
    filmMediaSelected:'',
    filmQuery:'',
    displayedComponents:['ItemsHeading'],
    reduxDataExample:`Pipe Content To Me!`
  },
});

const reduxDevTools = ( window.__REDUX_DEVTOOLS_EXTENSION__ || (f=>x=>x) )();
const store = createStore(
  combineReducers({ redux:reduxReducer, apollo:apolloClient.reducer() }),
  {},
  compose(applyMiddleware(apolloClient.middleware()), reduxDevTools),
);

setStateReader(store.getState);
setStateDispatcher(store.dispatch);

render((
  <ApolloProvider client={apolloClient} store={store}>
    <App />
  </ApolloProvider>
), document.getElementById('root'));
