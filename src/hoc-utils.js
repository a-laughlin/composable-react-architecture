/*
 This file contains a bunch of one-liners and other utils made for composability experiments
 As exploratory code, there are no tests, and little documentation.
 Feel free to ping me in the issues with questions.
 Error handling.  I haven't standardized error handling in the various pipes yet.
 The `pipeAsync` function thus far handles it the best, by normalizing sync and async functions,
 and letting downstream functions decide how to handle errors.
*/

/* eslint-disable no-unused-vars */
import React,{cloneElement,createElement,Children,createFactory} from 'react';
import {withHandlers,isClassComponent,withProps} from 'recompose';
import {styleObjectToClasses,mergeStyles} from './styles.js';
import {connect} from 'react-redux';
import {
  pipe, over, identity, isString, isPlainObject, isFunction, isNull,isUndefined,stubTrue,get, pick,map,
  transform as transformFP,flatten,find,mapValues,forOwn as forOwnFP,noop,flattenDeep,flatMap,mapKeys,
  partition,compose,compact,reduce,cloneDeep,without,capitalize,once,isError as isJSError,cond
} from 'lodash/fp';
import {set,merge,wrap} from 'lodash';

const [forOwn,transform] = [forOwnFP,transformFP].map(fn=>fn.convert({cap:false}));

/**
 * HTML Node names as HOC composers e.g., Div(...HOCs)
 * - encourages single, composable nodes
 * - discourages nested (i.e., coupled) nodes (HOC composers don't nest) #pitOfSuccess
 * - Makes HOC composition easy
 * - hides React's rule about lowercased strings being valid components.
 *
 * these are identical:
 * - const Div = toHOCComposer('div');
 * - const Div = (...fns)=>compose(...fns)('div')
 */
export const toHOCComposer = (str)=>(...fns)=>compose(...fns)(str);
export const [Div,Span,Ul,Ol,Dt,Dd,Dl,Article,P,H1,H2,H3,H4,H5,H6,Li,Input,A,Label,Pre] = (
             'div,span,ul,ol,dt,dd,dl,article,p,h1,h2,h3,h4,h5,h6,li,input,a,label,pre'
             .split(',').map(toHOCComposer));
export const TextInput = toHOCComposer(withProps({type:'text'})('input'));


export const is = val1=>val2=>val1===val2;
export const {isArray} = Array;
export const stubNull = ()=>null;
export const len0 = ({length})=>length===0;
export const len1 = ({length})=>length===1;
export const first=(arr)=>arr[0];
export const ensureArray = (val=[])=>isArray(val) ? val : [val];
export const elseIf = (ifTrue,ifFalse)=>predicate=>ifElse(predicate,ifTrue,ifFalse);
export const plog = (fromDev,transf=identity)=>(...fromPipe)=>{console.log(fromDev,transf(...fromPipe));return fromPipe[0];}
// don't love that there are 3 different piping functions
export const pipeEach = (...fns)=>(last,...args)=>{
  return map(itm=>{
    return reduce((result, fn)=>{
      return fn(result, ...args);
    }, itm)(fns);
  })(last);
};



export const transformToObj = fn=>obj=>transform(fn,{})(obj);

// groupByArray is lodash groupBy for arrays of values instead of single values
// example:
// groupByArray('dates')([ {dates:['2017','2018']}, {dates:['2018']}, {dates:['2017','2019']} ])
// result:
// {
//  '2017':[ {dates:['2017','2018']}, {dates:['2017','2019']} ],
//  '2018':[ {dates:['2017','2018']}, {dates:['2018']} ],
//  '2019':[ {dates:['2017','2019']} ]
// }
export const groupByArray = key => collection =>{
  const getter = cond([[isString,get],[isFunction,identity]])(key);
  return transform(
    (acc,item)=>{
      return ensureArray(getter(item)).forEach(str=>(acc[str]||(acc[str]=[])).push(item));
    }
  ,{})(collection)
};
// const testGroupByArray = ()=>{
//   if(!deepEqual(
//     groupByArray('dates')([ {dates:['2017','2018']}, {dates:['2018']}, {dates:['2017','2019']} ]),
//     {
//      '2017':[ {dates:['2017','2018']}, {dates:['2017','2019']} ],
//      '2018':[ {dates:['2017','2018']}, {dates:['2018']} ],
//      '2019':[ {dates:['2017','2019']} ]
//     }
//   )){return false;}
//   if(!deepEqual(
//     groupByArray('dates')([ {},null,undefined,'2018',2018,{dates:['2017']}]),
//     {'2017':[{dates:['2017']}]}
//   )){return false;}
//   return true;
// }
export const from = (str)=>(last,srcs)=>get(str)(srcs);
const valMapper = cond([
  [isFunction,identity],
  [stubTrue,from]
]);
export const mapValuesFrom = (keyMap)=>targetObj=>(
  transform((acc,v,k)=>{
    acc[k]=valMapper(v)(targetObj[k],targetObj)
  },{})(keyMap)
);
export const toObj = (key)=>val=>({[key]:val});
const assignFrom = (obj)=>(last,srcs)=>{
  if(!isPlainObject(obj)){throw new Error('assignFrom requires object as first arg: assignFrom(obj)')}
  if(isPlainObject(last)){
    return ({...last,...transform((acc,val,key)=>{acc[key]=get(srcs)(val)},{})(obj)})
  } else {
    // check for placeholder {key:'_'} ... assigns last to key
    return ({...transform((acc,val,key)=>{acc[key]=get(srcs)(val)},{})(obj)})
  }
};

// there are a few different kinds of pipes
// error handling differs
// arguments differ
// standardize?
// current fn arg cases: (last|error|promise, {...props[,event]})
//
// desires:
//  reference first pipe arg,
//  reference last pipe arg (default)
//  reference last non-error
//  reference any of the above, while while transforming a subset (see demo films filter)
//  catches errors and allows subsequent fns to decide what to do with them
//  handles sync and async
//  enables aborting
//  Works with lodash/fp out of the box
//
//
// potential solutions
// - return both a last value, and built up value
// - pass a single object with props for each reference
// - a function that splits the pipes into n parallel pipes
//   parallel and mergeParallels... i think I like this, as it's the most flexible,
//   and enables normal pipes, vs dual args reducer pipes
//   and lodash works out of the box
//   that said, it doesn't deal with the pipeEach/mapValues case, where you descend into a child structure
//   and aborting/error doesn't work as it does in pipeAsync doesn't necessarily work, or error case.  Hmm.
//   need to think on that more
//   e.g.,
//   function filterFilms ({films,filmYearsSelected,filmGenresSelected,filmMediaSelected,filmQuery}){
//     return filter(conforms({
//       year:y => len0(filmYearsSelected) || !len0(intersection(ensureArray(y),filmYearsSelected)),
//       genre:g => len0(filmGenresSelected) || !len0(intersection(ensureArray(g),filmGenresSelected)),
//       type:m => !filmMediaSelected || filmMediaSelected === m,
//       title:t => !filmQuery || t.toLowerCase().includes(filmQuery.toLowerCase()),
//     }))(films)
//   }
// standardize arguments via pipe factory:
//  normalize all promises, see pipeAsync for example
//  withItems is sync, and event pipes are async... just compose(Promise.resolve, pipe); to get pipeAsync?
//  all fns use args obj {last, lastValid, first, isAborted, [parentPipeArgs?]}
//  potential pipe args (last, argsObj) // unmodified lodash fns can work
//  potential pipe args (argsObj), lodash fns can work with wrapper that feeds them {last}
export const pipeAsync = (...fns)=>(input,...args)=>{
  const getFirstInput = once(identity);
  const getReducer = fn => (
    ifElse(isPipeAborted, identity, val => fn(val, getFirstInput(val), ...args) )
  );
  const normalizedSyncAsyncReducer = (accPromise,fn)=>{
    const reducer = getReducer(fn)
    if(!isPromise(accPromise)){ return reducer(accPromise); }
    return accPromise.then(reducer,reducer);
  };
  return Promise.resolve(
    fns.reduce(normalizedSyncAsyncReducer, input)
  )
  .catch((err)=>{
    if(process.env.NODE_ENV === 'production'){return err;}
    throw err;
  });
};
export const pipeEachAsync = compose(map,pipeAsync);

export const isUndefOrNull = val => val == undefined; // eslint-disable-line
export const ifElse = (predicate,ifTrue,ifFalse)=>(...args)=>((predicate(...args) ? ifTrue : ifFalse)(...args));
export const abortPipe = ()=>ABORT_PIPE;
export const swallowPipeAsyncErrors = stubTrue;
const isPromise = x=>!isUndefOrNull(x) && isFunction(x.then);
const ABORT_PIPE = Symbol('ABORT_PIPE');
const isPipeAborted = x => x===ABORT_PIPE;
export const getPipeFirstInput = (currentVal,firstVal)=>firstVal;
export const catchAndLogPipeError = x=>{console.log(x);console.error(x);return x;}
export const resolvePipeError = identity;
export const pipeValueToError = x=>{throw x;};
export const logAndThrow = pipeAsync(x=>{console.log('logAndThrow');return x;},catchAndLogPipeError,pipeValueToError);
export const logAndReset = pipeAsync(x=>{console.log('logAndReset');return x;},catchAndLogPipeError,getPipeFirstInput);
export const logAndAbort = pipeAsync(x=>{console.log('logAndAbort');return x;},catchAndLogPipeError,abortPipe);
export const ifError = (fn)=>ifElse(isJSError,fn,identity);
export const okElse = (onOkay,onError=logAndAbort)=>ifElse(isJSError,onError,onOkay);




export const lorem = (count=50)=>(new Array(count)).fill('lorem').join(' ');
export const invokeArgsOnObj = (...args) => mapValues((fn)=>fn(...args));
export const invokeObjectWithArgs = (obj)=>(...args) => mapValues((fn)=>isFunction(fn) ? fn(...args) : fn)(obj);
export const ifElseEach = pipeEach(ifElse);
export const condNoExec = (arrays)=> (...args)=>(find(arr=>arr[0](...args))(arrays)[1]);
export const converge = ifElse(isPlainObject,invokeObjectWithArgs,over);

export const sort = a => a.sort();
export const partitionObject = (...tests)=>(target)=>{
  const defaultCase = {...target};
  return tests.map(test=>{
    return transform((acc,val,key)=>{
      if(!test(val,key)){return;}
      acc[key]=val;
      delete defaultCase[key];
    },{})(defaultCase);
  }).concat([defaultCase]);
}


export const toggleArrayVal = (arr, val)=>arr.includes(val) ? without([val],arr) : [...arr,val];
export const toggleIn = dataKey=>(val,srcs)=>toggleArrayVal(get(dataKey)(srcs),val);

export const isLoading = (last,data)=> data.loading === true;
export const isError = (last,data)=>!!data.error;
export const isComplete = (last,data)=>data.loading === false;
export const fromEventTargetText = from('event.target.textContent');
export const fromEventTargetValue = from('event.target.value');
export const when = (test)=>(...items)=>(...args)=>(
  test(...args) ? pipeFnsIgnoreOther(items)(...args) : null
);
export const whenLoading = when(isLoading);
export const whenError = when(isError);
export const whenLoaded = when(isComplete);
export const fromPrimitiveItemProps = from('toItemData');
export const toItemProps = Component =>{
  return (props)=>{
    const itemData = isPlainObject(props) ? props : {toItemData:props};
    return createElement(Component,{'data-prop-generic':{...itemData,children:null,className:'',key:null}});
  }
}
export const toItemsProps = compose(pipeEach,toItemProps);//===pipeEach(toItemProps(arg))
export const pickValue = (obj)=>key=>obj[key];
export const pickValues = (obj)=>map(pickValue(obj));
export const mapEntities = (ids,entities)=>(...fns)=>converge(// common operation - more than one argument enables 1 loop vs 3
  get(ids),get(entities),((iarr,eobj)=>map(pipe(i=>eobj[i],...fns))(iarr))
);

// works like pipe when passed functions. Returns non-fns and passes original arg to next fn
// 0 items ()(arg)                []
// 1 item  (non-fn)(arg)          [n]
// 1 item  (fn)(arg)              [f(arg)]
// 2 items (non-fn fn)(arg)       [n fn(arg)]
// 2 items (fn non-fn)(arg)       [fn(arg) n]
// 2 items (fn1 fn2)(arg)         [fn2(fn1(arg))]
// 2 items (non-fn non-fn)(arg)   [n1 n2]
const pipeFnsIgnoreOther = (fnsArray)=>(last,srcs)=>{
  let lastResultIdx = 0;
  let lastResult = srcs;
  const outputArray = fnsArray.reduce((acc,fn)=>{
    if(isFunction(fn)){
      try{acc[lastResultIdx] = lastResult = fn(lastResult, srcs);}
      catch(e){
        console.log(`*** failed passing arg to fn ***`);
        console.log(`arg:\n`,srcs,`\n\nfn:\n`,fn, );
        console.error(e);
      }
    } else {
      acc[lastResult === srcs ? lastResultIdx++ : ++lastResultIdx] = fn;
      lastResult = srcs;
    }
    return acc;
  },[]);
  lastResult = null;
  return outputArray;
};

/**
 * HOC Factories (and their util functions)
 */

/**
 * withItems Factory
 * creates a flatted array of React elements from anything
 * see the itemToElements for 'anything'
 * sets keys when needed
 */
export const withItemsHOCFactory = (function() {
  const isElement = elem=>elem && !!elem.$$typeof;
  const notElement = elem=>!isElement(elem);
  const hasKey = elem=>elem.key !== null;
  const cloneWithKey = (elem,key)=>cloneElement(elem,{key});
  const mapWithIndex = fn => items => items.map(fn);
  const ensureKeys = mapWithIndex(cond([
    [notElement,identity],
    [hasKey,identity],
    [stubTrue,cloneWithKey]
  ]));
  const unwrapWhenPossible = cond([
    [len0,stubNull],
    [len1,first],
    [stubTrue,ensureKeys],
  ]);
  const isComponentThatReceivedRawArgs = elem => elem && elem.props && elem.props.props;
  const componentRawArgsWarning = (elem)=>{
    console.warn('Did you pass a component to withItems without putting it in an array?');
    console.log(`instantiated component:`, elem);
    return null;
  };
  const itemToElements = cond([
    [isUndefined,stubNull],
    [isNull,identity],
    [isComponentThatReceivedRawArgs, componentRawArgsWarning],
    [isElement,identity],
    [isString,itm=>createElement('span',null,itm)],
    [isClassComponent,itm=>createElement(itm,null)],
    [isFunction,itm=>itemToElements(itm())],// call & recurse
    [isArray,flatMap(itm=>itemToElements(itm))],
    [stubTrue,(itm)=>console.log(`unknown:`,itm)||createElement('pre',null,`unknown item type passed - received: ${JSON.stringify(itm,null,2)}`)],
  ]);


  const defaultDataAggregator = (self)=>{
    const dataPrefix = 'data';
    const itemProps = transform((acc,val,key)=>{
      // potential for name conflicts,
      // but keying by name vs creating a hierarchy avoids creating property DAGs
      // could add a conflict notification in non-production for pitOfSuccess
      if(key.startsWith(dataPrefix)){
        if(!isPlainObject(val)){console.log('non plain object data prop in',self);}
        Object.assign(acc,val);
      }
      else{acc[key]=val;}
    },{})(self.props);
    return itemProps;
  }

  return ({
    getReducerInput = defaultDataAggregator,
    reducer = pipeFnsIgnoreOther,
    reducerOutputToChildren = pipe(flattenDeep,itemToElements,ensureArray,unwrapWhenPossible),
  }={}) => (...pipes) => BaseComponent => {
    if(len0(pipes)){return BaseComponent;}
    const factory = createFactory(BaseComponent);
    class WithItems extends React.Component{
      render(){
        const pipeInput = getReducerInput(this);
        const reduced = reducer(pipes)(pipeInput,pipeInput);
        const children = reducerOutputToChildren(reduced);
        return factory(this.props,children);
      }
    }
    return React.createFactory(WithItems); // so we can call it as a function
  };
}());



/**
 * HOCs
 */
export const withItems = withItemsHOCFactory();
export const withConditions = (arrays)=>BaseComponent=>props=>{
  return find(arr=>arr[0](props))(arrays)[1](BaseComponent)(props);
};



// redux specific stuff - need to think more on how to decouple redux more effectively
const defaultIgnoreRegex = /^(@@|APOLLO|\.|\[)/;
export const getReduxReducer = ({
  initialState={},
  ignoreTest=defaultIgnoreRegex.test.bind(defaultIgnoreRegex), // no support for nested state properties currently,
  getNewState=(state,{type,payload})=>(type==='' ? {...state,...payload} : {...state,[type]:payload})
}={})=>(
  (state=initialState,action={})=>{
    return (ignoreTest(action.type) ? state : getNewState(state,action));
    // console.log(`action`, action);
    // console.log(`newState`, newState);
    // return newState;
  }
);

// wrapper around connect() to prevent injected dispatch fn and provide mapStateToProps shorthands
// tbd - consider how to do different states of a data value well.
// like loading, error, optimistic... userGoals... maybe in conjunction with toRedux
// or... more decoupled, maybe toRedux can handle it ... or... in the isLoading fn
// also how to do props that are valid vs/invalid
// props that need to be passed to withItems, vs those that are
const isValidHTMLProp = (function() {
  const validProps = {value:1,checked:1,placeholder:1,className:1};
  return (name)=>(name in validProps);
}());
export const withReduxData = arg => BaseComponent => {
  const transformFn = cond([
    [isFunction,()=>arg],
    [isString,()=>(state)=>({[arg]:get(arg)(state)})],
    [isPlainObject,mapValuesFrom],
  ])(arg);
  const prefix = 'data-prop-redux';
  return connect((state,ownProps)=>{
    const wrapInvalidHTMLPropsInDataPrefix = transform((acc,val,key)=>{
      (isValidHTMLProp(key) ? acc : acc[prefix])[key] = val;
    },{[prefix]:{}});
    return wrapInvalidHTMLPropsInDataPrefix( transformFn(state.redux,ownProps) );
  },{})(BaseComponent);
}

let DISPATCH;
let GETSTATE;
export const setStateReader = (reader=>{GETSTATE=reader;});
export const setStateDispatcher = (dispatcher=>{DISPATCH=dispatcher;});
export const toRedux = (type='')=>payload=>{DISPATCH({type,payload});return payload;};
export const toggleInRedux = key=>pipe(toggleIn(`state.${key}`),toRedux(key));
const defaultHandlerGetter = fns=>props=>event=>{
  if(len0(fns)){return;}
  const sources = {event,props,state:GETSTATE().redux}; // use redux to prevent apollo conflict
  const result = fns.reduce((last,fn)=>{
    if(!isFunction(fn)){return fn;}
    if(last==null){return fn(last, sources);}
    if(last.then){return last.then(l=>fn(l, sources));}
    return fn(last, sources);
  },sources);
  return result;
};
export const handlerPipeHOCFactory = ({
  getReducer=defaultHandlerGetter,
  on='Click'
})=>(...fns)=>withHandlers({[`on${on}`]:getReducer(fns)});

export const pipeClicks = handlerPipeHOCFactory({on:'Click'});
export const pipeChanges = handlerPipeHOCFactory({on:'Change'});
