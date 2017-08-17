// some base styles and helpers for working with styletron

import Styletron from 'styletron-client';
import {injectStyle} from 'styletron-utils';
import {identity,isString,isFunction,pipe} from 'lodash/fp';
import {createElement,Children,cloneElement} from 'react';
import merge from 'lodash/merge';
import {isPlainObject, rangeStep, forOwn as forOwnFP,transform as transformFP} from 'lodash/fp';

// convert to get both val and key
/* eslint-disable no-unused-vars */
const [forOwn,transform] = [forOwnFP,transformFP].map(fn=>fn.convert({cap:false}));
/* eslint-enable no-unused-vars */

const colors = (function(){
  const p = {};
  p.cTrans=`transparent`;
  p.cNone=`none`;

  '0123456789ABCDEF'.split('')
  .forEach(v=>{
    p[`c${v}`] = `#${v}${v}${v}`;
  });
  return p;
}());
const list = (function(){
  const p = {};

  p.lHorizontal = {
    listStyleType:'none',
    display:'flex',
    flexDirection:'row',
    alignItems:'center',
    alignContent:'flex-start',
    justifyContent:'flex-start',
    flexWrap:'nowrap',
  };
  p.lVertical = {
    ...p.lHorizontal,
    flexDirection:'column',
    alignItems:'flex-start',
  };
  p.lGrid = {
    ...p.lHorizontal,
    flexWrap:'wrap',
    alignItems:'flex-start',
    justifyContent:'space-evenly',
  };

  p.lHorizontalItem = {
    listStyleType:'none',
    flexGrow:'0',
    flexShrink:'1',
    flexBasis:'auto',
    width:'auto',
    height:'auto',
  };
  p.lVerticalItem = {
    ...p.lHorizontalItem,
    flexShrink:'0',
  };
  p.lGridItem = {
    ...p.lHorizontalItem,
  };
  p.lShrink0={flexShrink:'0'};
  p.lGrow0={flexGrow:'1'};
  p.lAIS = {alignItems:'flex-start'};
  p.lACS = {alignContent:'flex-start'};
  p.lAIC = {alignItems:'center'};
  p.lAIStretch = {alignItems:'stretch'};
  p.lACC = {alignContent:'center'};
  p.lAIE = {alignItems:'flex-end'};
  p.lACE = {alignContent:'flex-end'};
  p.lJCE = {justifyContent:'flex-end'};
  p.lJCS = {justifyContent:'flex-start'};
  p.lJCC = {justifyContent:'center'};
  p.lJCSA = {justifyContent:'space-around'};
  p.lJCSB = {justifyContent:'space-between'};
  p.lJCSE = {justifyContent:'space-evenly'};
  forOwn((val,key)=>{
    p[`l${key}`] = {backgroundColor:val};
  })(colors);
  return p;
}());

const border = (function(){
  const p = {};
  p.bSolid={borderStyle:'solid'};
  p.bDashed={borderStyle:'dashed'};
  p.bRound = {borderRadius:'0.5em'};
  forOwn((val,key)=>{
    p[`b${key}`] = {borderColor:val};
  })(colors);
  // create shortcuts for integers from 1-1000 and decimals from 1-100
  const sideAbbrevs = {t:'Top',r:'Right',b:'Bottom',l:'Left'};
  const unitAbbrevs = {'':'em',px:'px'};
  rangeStep(1, 0, 1000).forEach(num=>{
    forOwn((unitCss,unitShort)=>{
      const [int,dec='0'] = `${(num/10).toFixed(1)}`.split('.');
      const allSides = (p[`b${num}${unitShort}`] = {});
      const allSidesDec = (p[`b${int}p${dec}${unitShort}`] = {});
      forOwn((sideCss,sideShort)=>{
        Object.assign(allSidesDec,
          (p[`b${sideShort}${int}p${dec}${unitShort}`] = {[`border${sideCss}Width`]:`${int}.${dec}${unitCss}`})
        );
        Object.assign(allSides,
          (p[`b${sideShort}${num}${unitShort}`] = {[`border${sideCss}Width`]:`${num}${unitCss}`})
        );
      })(sideAbbrevs);
    })(unitAbbrevs);
  });
  return p;
}());
const text = (function(){
  const p = {};
  forOwn((val,key)=>{
    p[`t${key}`] = {color:val};
  })(colors);
  p.tSans = { // from https://css-tricks.com/snippets/css/system-font-stack/
    fontFamily: `-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,`+
                `Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif`
  }
  p.tSerif = {fontFamily: `serif`};
  p.tCapital={textTransform:'capital'};
  p.tUpper={textTransform:'uppercase'};
  p.tLower={textTransform:'lowercase'};
  p.tUnderline={textDecoration:'underline'};
  p.tItalic={textDecoration:'italic'};
  p.tBold = {fontWeight:'700'};
  // someday maybe... make all the ranges more dynamic and flexible by keyValExpander lazy creation/memoization...
  rangeStep(0.1, 0.1, 3).forEach(num=>{
    const fontNum = num.toFixed(1);
    const lhNum = (num+0.4).toFixed(1)
    const [int,dec='0'] = `${num.toFixed(1)}`.split('.');
    const key = dec==='0'?`t${int}`:`t${int}p${dec}`;
    p[key]={lineHeight:`${lhNum}em`,fontSize:`${fontNum}em`};
  });
  p.tLink = {
    ...p.tUnderline,
    ':link':p.tUnderline,
    ':visited':p.tUnderline,
    ':hover':p.tUnderline,
    ':active':p.tUnderline,
  };
  return p;
}());

const sizing = (function(){
  const p = {};
  // width height margin - shorter syntax than the rest since they're super common
  p.wAuto = {width:`auto`};
  p.hAuto = {height:`auto`};
  p.mtAuto = {marginTop:`auto`};
  p.mrAuto = {marginRight:`auto`};
  p.mbAuto = {marginBottom:`auto`};
  p.mlAuto = {marginLeft:`auto`};
  p.mAuto = Object.assign({}, p.mtAuto, p.mrAuto, p.mbAuto, p.mlAuto);
  p.wInherit = {width:`inherit`};
  p.hInherit = {height:`inherit`};
  p.mtInherit = {marginTop:`inherit`};
  p.mrInherit = {marginRight:`inherit`};
  p.mbInherit = {marginBottom:`inherit`};
  p.mlInherit = {marginLeft:`inherit`};
  p.mInherit = Object.assign({}, p.mtInherit, p.mrInherit, p.mbInherit, p.mlInherit);

  // create shortcuts for integers from 1-1000 and decimals from 1-100
  const sideAbbrevs = {t:'Top',r:'Right',b:'Bottom',l:'Left'};
  const unitAbbrevs = {'':'em',pct:'%',px:'px'};
  rangeStep(1, 0, 1000).forEach(num=>{
    p[`z${num}`]={zIndex:`${num}`};
    forOwn((unitCss,unitShort)=>{
      const [int,dec='0'] = `${(num/10).toFixed(1)}`.split('.');
      p[`w${int}p${dec}${unitShort}`]={width:`${int}.${dec}${unitCss}`};
      p[`h${int}p${dec}${unitShort}`]={height:`${int}.${dec}${unitCss}`};
      p[`w${num}${unitShort}`] = {width:`${num}${unitCss}`};
      p[`h${num}${unitShort}`] = {height:`${num}${unitCss}`};
      const allSides = (p[`m${num}${unitShort}`] = {});
      const allSidesDec = (p[`m${int}p${dec}${unitShort}`] = {});
      forOwn((sideCss,sideShort)=>{
        Object.assign(allSidesDec,
          (p[`m${sideShort}${int}p${dec}${unitShort}`] = {[`margin${sideCss}`]:`${int}.${dec}${unitCss}`})
        )
        Object.assign(allSides,
          (p[`m${sideShort}${num}${unitShort}`] = {[`margin${sideCss}`]:`${num}${unitCss}`})
        )
      })(sideAbbrevs)
    })(unitAbbrevs)
  });
  return p;
}());

/**
 * HELPERS
 */


// shortcut expander to enable styles like {before:{..styles..}} instead of {":before":{..styles..}}
const styleKeyShortcuts = {
  before:':before',
  after:':after',
  first:':first-child',
  last:':last-child',
  link:':link',
  visited:':visited',
  hover:':hover',
  active:':active',
  ...rangeStep(100, 300, 4000).reduce((acc,num)=>{
    acc[`above${num}px`] = `@media (min-width: ${num-1}px)`;
    acc[`below${num}px`] = `@media (max-width: ${num}px)`;
    return acc;
  },{}),
  ...rangeStep(1, 1, 100).reduce((acc,num)=>{
    acc[`n${num}`] = `:nth-child(${num})`;
    return acc;
  },{})
};

function keyValExpander(src, infiniteRecursionPreventer){
  if(infiniteRecursionPreventer.has(src)){return src;}
  infiniteRecursionPreventer.set(src,true);
  return transform((dest,val,key)=>{
    if(val===undefined){console.warn(`undefined value for key: "${key}"`);}
    if(styleKeyShortcuts.hasOwnProperty(key)){key = styleKeyShortcuts[key];}
    if(Array.isArray(val)){dest[key] = keyValExpander(Object.assign({},...val),infiniteRecursionPreventer);}
    else if(isPlainObject(val)){dest[key] = keyValExpander(val, infiniteRecursionPreventer);}
    else {dest[key] = val;}
  },{})(src);
}
export const expandStyleShortcuts = (srcObj={})=>keyValExpander(srcObj, new WeakMap());
export const mergeStyles = (...stylesObjects)=>merge({},...(stylesObjects.map(expandStyleShortcuts)));

const styletron = new Styletron();
export const styleObjectToClasses = stylesObj=>injectStyle(styletron, stylesObj);



const logStylesMessage = (type,obj,invalid={})=>{
  const invalidKeys = Object.keys(invalid).join(',');
  console.warn(`Invalid ${type} styles "${invalidKeys}" passed in:\n${JSON.stringify(obj,null,2)}`);
};
const validateListStyles = (function() {
  if(process.env.NODE_ENV === 'production'){return identity;}
  const invalidListKeys = {
    width:1,height:1,
    margin:1,marginTop:1,marginBottom:1,marginLeft:1,marginRight:1,
    position:1,left:1,right:1,top:1,bottom:1,zIndex:1,
    flexBasis:1,flex:1,flexGrow:1,flexShrink:1,
    pointerEvents:1,overflow:1
  };
  return (obj)=>{
    let hasInvalid = false;
    const result = transform(({valid,invalid},val,key)=>{
      (invalidListKeys[key] ? (hasInvalid = true && invalid) : valid)[key]=val;
    },{invalid:{},valid:{}})(obj);
    if(hasInvalid){logStylesMessage('list', obj, result.invalid)};
    return result.valid;
  }
}());
const validateItemContextStyles = (function() {
  return identity;
  // much code duplicated with validateListStyles - move to invalidStylesFilterFactory
  // const invalidListKeys = {
  //   alignItems:1,alignContent:1,justifyContent:1,
  // };
  // const invalidStylesFilterFactory = ()=>{};
}());

/**
 * withStyles && withItemContextStyles
 */
export const stylesHOCFactory = ({
  stylesTest = isPlainObject,
  componentTest = (arg => isFunction(arg)||isString(arg)),
  mergeStyles,
  stylesToProps = mergedStyles=>({className:styleObjectToClasses(mergedStyles)}),
  mergeProps = (props,sProps)=>({...props,className:`${props.className||''} ${sProps.className||''}`}),
  styles,
  factoryFn,
  onError = (args)=>{
    console.log(`stylesHOCFactory Component + Styles tests failed.\nReturning first of:\n`,args);
    return args[0];
  }
}={})=>(...args)=>{
  if(args[0]==='getMerged'){return styles;}
  if(componentTest(args[0])){return factoryFn(args[0],mergeProps,stylesToProps(styles));}
  if(stylesTest(args[0])){
    return stylesHOCFactory(
      {stylesTest,componentTest,mergeStyles,mergeProps,factoryFn,styles:mergeStyles(styles,...args)}
    );
  }
  return onError(args);
};


export const withStyles = stylesHOCFactory({
  mergeStyles:pipe( mergeStyles, validateListStyles),
  factoryFn:(Component, mrgProps, sProps)=>(props={})=>createElement(Component,mrgProps(props,sProps)),
});
export const withItemContextStyles = stylesHOCFactory({
  mergeStyles:pipe( mergeStyles, validateItemContextStyles),
  factoryFn:(Component, mrgProps, sProps)=>(props={})=>(
    createElement( Component, props,
      Children.map(props.children,(elem)=>(
        !elem ? null : cloneElement(elem, mrgProps(elem.props,sProps))
      ))
    )
  )
});
export const styles = {
  ...colors,
  ...list,
  ...border,
  ...text,
  ...sizing,
};
// style shorthands
export const [v,h,g] = [list.lVertical,list.lHorizontal,list.lGrid].map(s=>withStyles(s));
export const [vi,hi,gi] = [list.lVerticalItem,list.lHorizontalItem,list.lGridItem].map(s=>withItemContextStyles(s));
// wireframe item shorthands
export const [wfvi,wfhi,wfgi] = [
  ['blue',list.lVerticalItem],['red',list.lHorizontalItem],['darkgreen',list.lGridItem]
].map(([color,itmDir])=>withItemContextStyles({borderColor:color},itmDir,text.tc3,border.b1px,border.bDashed));
