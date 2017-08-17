# UI Hyper-Composability Demo

Companion to blog post at [link tbd](http://a-laughlin.com/hyper-composable-react-architecture).


## Installing & Running.
**Install** `npm i`;
**Run** `npm start`;

Built on [create-react-app](https://github.com/facebookincubator/create-react-app).

Basic concept.  Prototype a hyper-composable, hyper-decoupled architecture that's been rattling around in my head for a bit.  The result thus far is the fastest and most fun UI architecture I've ever prototyped in.  Little to no boilerplate also.  For details, see the blog post.
Includes GraphQL, React, Redux.



## File Structure
- public/index.js - initializes the redux store and renders `App`
- src/reset.css - reset styles...
- src/components.js - All demo components.  Exports most. Includes app.
- src/hoc-utils.js - all the HOC util functions for the demo
- src/styles.js - integrates styletron, provides styles shorthands and HOCs
- src/api.js - graphql schema and some basic api interaction functions
