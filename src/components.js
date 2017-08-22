/* eslint-disable no-unused-vars */ // because exploratory prototype
import {withProps,mapProps,defaultProps} from 'recompose';
import React from 'react'; // for examples with jsx, though jsx is unnecessary with per-node HOC composers
import {
  withItems, plog, toObj, toDataProp, pipeEach,
  sort, from, when, withReduxData, ensureArray,
  pipeClicks, pipeChanges,toRedux, fromPrimitiveItemProps, toItemProps, toItemsProps,fromEventTargetText,
  fromEventTargetValue,toggleInRedux,is,len0, whenLoading,whenError,whenLoaded,ifElse,isLoading,
  lorem, pickValue,pickValues,groupByArray,
  Div,Span,Ul,Li,Input,A,Label,TextInput
} from './hoc-utils';
import {gql,graphql as withGQLData} from 'react-apollo';
import {loadRandomNorrisQuote} from './api';
import {
  pick, pipe, capitalize, startCase, get, map, sortBy, filter, identity, over,flatMap, uniq, cond,
  conforms,intersection,assign,stubTrue,compose,keys
} from 'lodash/fp';
import {styles, withStyles,withItemContextStyles} from './styles.js';
const {
  // Styles (favoring abbreviations over abstraction for learnability)
  // Not sold on Styletron or these abbreviations yet.  Created for the demo.
  /* flexbox align */ lAIS,lAIC,lAIE,  /* justify */ lJCS,lJCC,lJCE,lJCSB,lJCSA,lJCSE,
  /* l: list colors */ lc3,lc7,lcD,lcE,lcF,lcNone,
  /* l: list flexbox defaults */ lVertical,lHorizontal,lGrid, lVerticalItem,lHorizontalItem,lGridItem,
  /* b: border colors, styles, sizes */ bc3,bcC,bSolid,bDashed,bRound,bt0,b1px,bb0p2,bt1px,bb1px,
  /* t: text colors, styles, sizes */ tcFFF,tc0,tc3,tc6,tc9,tcB,tcE,tSans,tSerif,tUnderline,t0p8,t1,t1p2,
  /* m: margin */ mb0,mr0,m0p2,mr0p2,mt0p2,mb0p2,mr0p5,ml0p5,mt0p5,mb0p5,m0p5,m1,ml1,mr1,mt1,mb1,mlAuto,
  /* w: width */ w6,w8,w10,w200px,wAuto,w70pct,w100pct, /*height*/ h1p6, /*zIndex*/ z1,z2,z3,
} = styles;


/**
 * withItems is a HOC that provides a consise, declarative syntax to transform inputs like text,
 * components, and data into list items.
 *
 * Div(withItems('Some Text')) -> <div><span></div></div>
 *
 * Notes:
 * - It is synchronous.
 * - It works well with Ramda and lodash/fp functions (the examples use lodash/fp extensively)
 * - It encourages exportable components and a flat html structure.
 * - All nodes are presentational.  There are no wasted nodes (thus Flexbox always works).
 * - All text nodes are wrapped in spans for flexbox.
 * - Discourages passing props more than one deep.
 *
 * Basic operation:
 * - Non-functions are queued
 * - Consecutive functions are reduced and their output queued
 * - The queue gets run through createElement, flattened, then added to props.children.
 * - It sounds weird, but is a lot faster to work with than manual JSX.
 *
 * Arguments to piped functions: (last, flattenedProps)
 * - May change when I get around to standardizing the various pipes
 * - flattenedProps flattens data props, resulting in {...props,...props.data-a,...props.data-b}
 * - flattenedProps decouples piped fns from the implementation of data-providng HOCs like
 *   react-redux connect(), and graphql(), and some utility functions
 *
 * Simple examples below.  withItems is used in more complex ways throughout the demo
 */


// HTML Nodes as HOC Composers
// const Div = (...fns) => compose(...fns)('div');

export const ItemsHeading = Div(withItems(`withItems: The Unstyled First Heading.`));

export const Items1 = Div(withItems('Text!'));

// While any non-function won't get piped, arrays make it explicit
export const Items2 = Div(withItems(['More Text! In an Array!']));

// withItems is just a fancy wrapper around createElement, so any valid React component is fine.
// The exception: strings like 'div' are treated as text, because blank nodes are low priority.
export const SomeComponent = props=><div {...props}>Stateless Functional Component!</div>
export const Items3 = Div(withItems([SomeComponent]));

// function outputs get piped
export const BlankInput = Input(defaultProps({defaultValue:'default text'}));
export const Items4 = Div(withItems(()=>({defaultValue:'Piped Function Output!'}),BlankInput));

// const wItems3 = Div(withItems(SomeComponent));
// Fails! The flattened "data-" props are invalid html elements properties

export const ItemsContent = Div( withItems([Items1, Items2, Items3, Items4]) );





/**
 * Styles
 *
 * withStyles
 * A HOC for all the styles needed to display a component.
 * It intentionally does not support positional/sizing styles like width, height, margin,
 * flex, alignSelf, flexGrow, flexShrink.  Those go in the parent list's withItemContextStyles,
 * so they will apply to the item only when in that list.
 *
 * Another way to think about it is with React components:
 * - Components... can set their own default props and alter childrens' props.
 * - Lists...      can set their own default styles and alter items' styles.
 *
 * withItemContextStyles
 * A HOC that applies context-specific styles to children
 * Usually those are the same positional styles that withStyles doesn't support.
 * The benefit is super reusable components that render anywhere at any size.
 * The tradeoff is time designing ... components that render anywhere, at any size.
 * Fortunately, it's a good candidate for incremental improvements.  All applicable styles are
 * directly on the element, so there's no hunting for them.
 */

export const StylesHeading = Div(
  withItems(`Styles`,`Styletron`),
  withStyles(lGrid,lcD,tc3, lJCSB, t1p2, bc3, bSolid, bt1px,bb1px),
  withItemContextStyles(lGridItem)
);
export const StylesContent = Div(
  withItems('Styles'.split('')),
  withStyles(lVertical),
  withItemContextStyles(lVerticalItem,{n1:tc0,n2:tc3,n3:tc6,n4:tc9,n5:tcB,n6:tcE})
);





/**
 * Style Shorthands
 *
 * Styles are rarely where bugs originate, so it's useful to not have to see them when debugging.
 * We can minimize their visual footprint through shorthands.
 *
 * WithStyles returns a new hoc when you pass it styles objects, so you can call
 * the HOC as a function to pass it new styles.
 */

const v = withStyles(lVertical);
const h = withStyles(lHorizontal);
const g = withStyles(lGrid);

// or map and destructure instead of typing withStyles every time
const [vi,hi,gi] = map(withItemContextStyles)([lVerticalItem,lHorizontalItem,lGridItem]);

// compose in some other styles for fast wireframing
// const [vi,hi,gi] = map(
//   ([color,itmDir])=>withItemContextStyles({borderColor:color},itmDir,tc3,b1px,bDashed)
// )([['blue',lVerticalItem],['red',lHorizontalItem],['#0B0',lGridItem]]);


// call a styles hoc with more styles to get a new hoc with the new styles merged in
// keep in mind though, that doing so creates an abstraction dependency graph.  Use sparingly.
const headingListStyles = g(lJCSB,lcD,tc3, t1p2, bc3, bSolid, bt1px, bb1px)

// composing HOCs is easy since they're just functions
const headingStyles = compose(gi, headingListStyles);

// and composing them with components is easy with HOC composers like Div()
export const StylesShortHeading = Div(
  withItems(`Style Shorthands`,`Flexbox: Vertical, Horizontal, Grid`),
  headingStyles
);

// some grid, vertical, and horizontal flexbox examples.
const wStylesItems = withItems('Styles'.split(''));
const itemStyles = {n1:tc0,n2:tc3,n3:tc6,n4:tc9,n5:tcB,n6:tcE};
export const StylesG = Div(wStylesItems, g, gi(itemStyles));
export const StylesV = Div(wStylesItems, v, vi(itemStyles));
export const StylesH = Div(wStylesItems, h, hi(itemStyles));

export const StylesShortContent = Div(withItems([StylesV, StylesG, StylesH]), v(t0p8), vi({n2:w100pct},mt1));





/**
 * Connect()ing Redux Data
 *
 * withReduxData:
 * - Wraps react-redux connect's(...) mapStateToProps.
 * - Provides shortcuts to reduce boilerplate and improve code signal to noise ratio for learnability
 * - Prevents invalid props errors from auto-injecting dispatch into string (e.g. 'div') components.
 */

export const ReduxDataHeading = Div(withItems('Connect()ing Redux Data'), headingStyles);

export const ReduxDataLabel = Div(withItems(`1 way Data Bind (withReduxData)`));
export const ReduxDataDiv = Div(withReduxData('reduxDataExample'),withItems(from('reduxDataExample')));

export const ReduxDataContent = Div(withItems([ ReduxDataLabel, ReduxDataDiv ]),v,vi(mb0p5));





/**
 * Event Handler Pipes
 * create an event handler pipe with handlerPipeHOCFactory({on:'Click'})
 * transform and send the event to any destination by passing functions
 * e.g., toRedux() is basically a redux store dispatch() wrapper
 * destinations are limited only by the function passed in.  toRedux, toGraphql, toApi, wherever...
 *
 * piped functions receive arguments similar to withItems, but get an 'event' prop
 * fn(last, {...props,event});
 *
 * The action of toRedux is simple.  Here's the actual code currently.
 * const toRedux = (type='')=>payload=>{DISPATCH({type,payload});return payload;};
 * const rootReducer = (state,{type,payload})=>(type==='' ? {...state,...payload} : {...state,[type]:payload})
 */
export const EventPipeHeading = Div(withItems(`Event Handler Pipes`), headingStyles);

export const TwoWayLabel = Span(withItems('2 way Data Bind (withReduxData + toRedux)'));
export const TwoWayInput = TextInput(
  withReduxData({value:'reduxDataExample'}),
  pipeChanges(fromEventTargetValue, toRedux('reduxDataExample')),
);
export const TwoWayBindingSection = Div(withItems([TwoWayLabel,TwoWayInput]),g(lJCSB),gi(mt0p5,mb0p5));


const rdxNorris = 'norrisContent';
export const NorrisText = Div(withReduxData(rdxNorris), withItems(from(rdxNorris)), h(t0p8),hi(m1));

// handler pipes take both sync and async operations
export const NorrisBtn = Div(
  pipeClicks('Loading!',toRedux(rdxNorris),loadRandomNorrisQuote,toRedux(rdxNorris)),
  withItems('Load a Norris Quote!'),
  v(lcD,bRound,{cursor:'pointer'}), vi(m0p5),
);
export const NorrisSection = Div(withItems([NorrisBtn, NorrisText]), vi(mt1,{last:mb1}), v(lAIC));

export const EventPipeContent = Div(withItems([TwoWayBindingSection,NorrisSection]),vi(w100pct),v);





/**
 * Filterable Movies
 */
const FilterableHeading = Div(withItems('Filterable Content','GraphQL (with mocks)'), headingStyles);
/* MovieFilterFilterForm Row 1 */
const DropDownRow = Span(hi(m0p2,lAIC), h(lJCS, t0p8,{cursor:'pointer',first:t1}));
const withCheckedStyles = withStyles({before:{content:'"\\2705"',flex:'0', alignSelf:'center'}});
const withNonCheckedStyles = withCheckedStyles({before:{content:'"\\2700"'}});
const toCheckedRow = predicate => cond([ // conditional styles could be more intuive, but this works for now
  [predicate,toItemProps(withCheckedStyles(withItems(fromPrimitiveItemProps)(DropDownRow)))],
  [stubTrue,toItemProps(withNonCheckedStyles(withItems(fromPrimitiveItemProps)(DropDownRow)))]
]);
const genreSelected = (genres,{filmGenresSelected})=>filmGenresSelected.includes(genres);


export const GenreDropDown = Div(
  withGQLData(gql`query {films {genre}}`,{}),
  withReduxData('filmGenresSelected'),
  pipeClicks(fromEventTargetText, toggleInRedux('filmGenresSelected')),
  withItems(['Genre'], from('films'), groupByArray('genre'),keys,sort, pipeEach(toCheckedRow(genreSelected))),
  v, vi(lcE,bt1px,bcC,bSolid,t0p8,w100pct,{padding:'0 0.2em',first:[bb0p2,bt0,t1,{cursor:'default'}]}),
);
const yearSelected = (year,{filmYearsSelected})=>filmYearsSelected.includes(year);
export const YearDropDown = Div(
  withGQLData(gql`query {films {year}}`),
  withReduxData('filmYearsSelected'),
  pipeClicks(fromEventTargetText, toggleInRedux('filmYearsSelected')),
  withItems(['Year'], from('films'), sortBy('year'), map('year'), uniq, pipeEach(toCheckedRow(yearSelected))),
  v, vi(lcE,bt1px,bcC,bSolid,t0p8,w100pct,{padding:'0 0.2em',first:[bb0p2,bt0,t1,{cursor:'default'}]}),
);


const FilmSearch = TextInput(
  withReduxData({value:'filmQuery'}),
  pipeChanges(fromEventTargetValue, toRedux('filmQuery')),
);
export const GlassedFilmSearch = Div(
  withItems([FilmSearch]),
  hi(w100pct,{backgroundColor:'transparent'}),
  h({after:{...lAIC,display:'inline-flex', marginLeft:'-1.2em', content:'"\\1F50E"'}}),
);


/* MovieFilterFilterForm Row 2 */
export const MediaRadioInput = Input(withProps({type:'radio',name:'media-type'}));

const MediaRadio = (mediaType)=>Div(
  pipeClicks(mediaType,toRedux('filmMediaSelected')),
  withReduxData('filmMediaSelected'),
  withItems(
    from('filmMediaSelected'),is(mediaType),toObj('checked'),MediaRadioInput,
    [`${capitalize(mediaType)}s`]
  ),
  hi({pointerEvents:'none'},ml0p5),
  h({cursor:'pointer'}),
);
export const MovieRadio = MediaRadio('movie');
export const BookRadio = MediaRadio('book');
export const FilmClearItem = A(
  pipeClicks({filmYearsSelected:[],filmGenresSelected:[],filmMediaSelected:'',filmQuery:''},toRedux()),
  withItems(['Clear Filters']),
  hi,h(lJCC,tUnderline,{cursor:'pointer'})
);

export const MovieFilterRow1 = Div(
  withItems([GenreDropDown, YearDropDown, GlassedFilmSearch]),
  g, gi(wAuto,h1p6,mr0p5,{n1:z3,n2:z2,n3:z1,overflow:'hidden',hover:{overflow:'visible'},first:ml0p5,last:[mlAuto]})
);
export const MovieFilterRow2 = Div(
  withItems([MovieRadio, BookRadio, FilmClearItem]), g, gi(wAuto,mr0p5,{first:ml0p5,last:[mlAuto]})
);
export const MovieFilterFilterForm = Div(
  withItems([MovieFilterRow1, MovieFilterRow2]), vi(w100pct,mt0p5,{last:mb0p5}), v(bcC,bSolid,b1px)
);

/* Film Grid */
const FilmSummaryBox = Li( // not exporting since it requires specific props
  defaultProps({title:'default title', year:'default year'}),
  // want a text creation w/ variables w/o function creation... less code noise...
  // maybe lodash template with {} or ${}... withItems('{title} ({year})')
  withItems(({title,year})=>`${title} (${year})`),
  vi(mt0p5,mb0p5,w100pct),
  v(t0p8),
);
function filterFilms ({films,filmYearsSelected,filmGenresSelected,filmMediaSelected,filmQuery}){
  return filter(conforms({
    year:y => len0(filmYearsSelected) || !len0(intersection(ensureArray(y),filmYearsSelected)),
    genre:g => len0(filmGenresSelected) || !len0(intersection(ensureArray(g),filmGenresSelected)),
    type:m => !filmMediaSelected || filmMediaSelected === m,
    title:t => !filmQuery || t.toLowerCase().includes(filmQuery.toLowerCase()),
  }))(films)
}
export const FilmGrid = Div(
  withGQLData(gql`query {films {title,year,genre,type,poster}}`,{}),
  withReduxData(pick(['filmYearsSelected','filmGenresSelected','filmMediaSelected','filmQuery'])),
  withItems(
    whenLoading('Loading!'),
    whenError('Error!'),
    whenLoaded(filterFilms, sortBy('title'), toItemsProps(FilmSummaryBox)),
  ),
  gi(w100pct,{flexShrink:'0',flexGrow:'0',above400px:w200px}),
  g(bcC,bSolid,b1px),
);
const FilterableContent = Div(withItems([ MovieFilterFilterForm, FilmGrid]),vi(w100pct),v);




/**
 * Reusability (demo rendering components in different nesting/orders)
 */
const ReusabilityHeading = Div(withItems('Reusability: Components in Other Orders'), headingStyles);
const componentOptions = {
  Items1,Items2,Items3,Items4, ItemsHeading, ItemsContent,
  StylesHeading,StylesContent,
  StylesShortHeading, StylesShortContent,StylesG, StylesV, StylesH,
  TwoWayLabel, TwoWayInput, TwoWayBindingSection,
  NorrisText, NorrisBtn, NorrisSection,
  EventPipeContent, EventPipeHeading,
  GenreDropDown, YearDropDown, FilmSearch, GlassedFilmSearch, MovieFilterRow1,
  MovieRadio, BookRadio, FilmClearItem, MovieFilterRow2,
  MovieFilterFilterForm, FilmGrid
};
const allComponentKeys = ()=>Object.keys(componentOptions);
const componentSelected = (name,{displayedComponents})=>displayedComponents.includes(name);
const DisplayedComponentSelector = Div(
  withReduxData('displayedComponents'),
  pipeClicks(fromEventTargetText,toggleInRedux('displayedComponents')),
  withItems(['Components'],allComponentKeys,pipeEach(toCheckedRow(componentSelected))),
  v, vi,
);

const DisplayedComponentsGrid = Div(
  withReduxData('displayedComponents'),
  withItems(from('displayedComponents'),pickValues(componentOptions)),
  g(lAIS,lJCS), gi
);
const ReusabilityContent = Div(
  withItems([DisplayedComponentSelector,DisplayedComponentsGrid]),
  g(lAIS,{above400px:{flexWrap:'nowrap'}}), gi({last:[w100pct,ml1]})
);



/**
 * App
 */
export const App = Div(
  withItems([
    ItemsHeading, ItemsContent,
    StylesHeading,StylesContent,
    StylesShortHeading, StylesShortContent,
    ReduxDataHeading,ReduxDataContent,
    EventPipeHeading, EventPipeContent,
    FilterableHeading, FilterableContent,
    ReusabilityHeading, ReusabilityContent,
  ]),
  vi(tSans,mt1,w100pct,{above600px:{padding:'0 15%'}}),
  v(lAIC,{fontSize:'12px',above400px:{fontSize:'14px'},above600px:{fontSize:'16px'}})
);
