/* eslint-disable no-unused-vars */
// disabling eslint no-unused-vars because prototyping/learning

// disabling graphql because it was too time consuming
import { makeExecutableSchema,addMockFunctionsToSchema } from 'graphql-tools'
import { mockNetworkInterfaceWithSchema } from 'apollo-test-utils';
import ApolloClient from 'react-apollo'
// import gql from 'graphql-tag';
import {media as filmsCollection} from './film-data';
import {
  get,map,filter,find,identity,pick,values,uniq,mapValues,flatten,keyBy,isPlainObject
} from 'lodash/fp';
import merge from 'lodash/merge';
// to decouple our components from our data implementation

export const objToKeyValStrFactory = ({
  getPrefix=()=>'',
  getSuffix=()=>'',
  mapPairs=identity,
  keySplit = '=',
  pairSplit = '&'
} = {})=>(input={})=>{
  const output = Object.keys(input)
  .map(k=>([k, input[k]].map(mapPairs).join(keySplit)))
  .join(pairSplit);

  return getPrefix(input,output) + output + getSuffix(input, output);
};
export const objToUrlParams = objToKeyValStrFactory({
  getPrefix:(input,output)=>output ? '?' : '',
  mapPairs:encodeURIComponent,
});
export const fFetch = (options={})=>(more={})=>(data)=>{
  const {
    url, method, mode, redirect, headers, search, body, credentials, paramSerializer
  } = merge(
    { url:'', method:'GET', mode:'cors', redirect:'follow', headers:{}, search:{}},
    options,
    more,
    {body:data}
  );
  return fetch(
    url+objToUrlParams(search),
    {method,mode,redirect,headers,body,credentials}
  );
};

export const responseJsonToObj = resp=>resp.json(); // or lodash method('json');
export const objToJsonString = data=>JSON.stringify(data);
export const objToJsonStringPretty = data=>JSON.stringify(data,null,2);
export const jsonStringToObj = JSON.parse.bind(JSON);



export const loadRandomNorrisQuote = (last,srcs)=>(
  fFetch({url:`http://api.icndb.com/jokes/random?escape=javascript`})()()
  .then(responseJsonToObj)
  .then(get('value.joke'))
);





// // cool.  I can use the same schemas on the server as I can on the client.
const schemas = {
  films:(function(films) {

    const typeDefs = `

      type Film {
        title: String!
        year: String
        type: String
        poster: String
        genre: [String]
      }

      type Query {
        film (title: String): Film
        films : [Film]
      }

      type Mutation {
        addFilm(title: String!, year: String, type: String, poster:String, genre:[String]): Film!
      }

      schema {
        query: Query
        mutation: Mutation
      }
    `;

    const filmsIndex = keyBy('title')(films);
    const resolvers = {
      // Need to learn how the apollo client and server batch/memoize.
      // http://dev.apollodata.com/core/how-it-works.html#query-benefits
      Query: {
        film:(obj, {title}, context, info)=>filmsIndex.title[title],
        films:(obj, args, context, info)=>{
          return films;
        },
      },
      Film: {
        genre:(title)=>filmsIndex[title] && filmsIndex[title].genre,
        year:(title)=>filmsIndex[title] && filmsIndex[title].year,
        type:(title)=>filmsIndex[title] && filmsIndex[title].type,
        poster:(title)=>filmsIndex[title] && filmsIndex[title].poster,
        title:(title)=>filmsIndex[title] && filmsIndex[title].title,
      },
    };

    return makeExecutableSchema({ typeDefs, resolvers });
  }(filmsCollection)),
};


// Initialize client
export const apolloClient = (function(schema) {
  // Add mocks
  addMockFunctionsToSchema({
    schema,
    mocks: {},
    preserveResolvers: true,
  });

  // Create network interface
  const mockNetworkInterface = mockNetworkInterfaceWithSchema({ schema });

  return new ApolloClient({
    networkInterface: mockNetworkInterface,
  });
}(schemas.films));


// const loggedQuery = (promise,myLoggingMsg,logParams)=>{
//   return promise
//   .then((resp)=>{
//     console.log('myLoggingMsg:',myLoggingMsg,'\n', 'logParams:',logParams,'\n','response:',resp);
//     // console.log('response:', resp);
//     return resp;
//   })
//   .catch((err)=>{
//     console.log('myLoggingMsg:',myLoggingMsg,'\n', 'logParams:',logParams);
//     console.error(err);
//     return err;
//   })
// }

// for up an actual server+client in the browser, when no ability to modify endpoints
// https://github.com/lucasconstantino/graphql-apollo-rest-wrap/blob/master/POST.md
//
// const exampleClient = new ApolloClient({
//   networkInterface: {
//     query: (arg={}) => {
//       const { query, operationName, variables } = arg;
//       return loggedQuery(graphql(schema, printAST(query), null, null, variables, operationName),'client query',{query,operationName,variables})
//     }
//   }
// });
