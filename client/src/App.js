import React, {Fragment} from 'react';
import Navbar from './components/layout/Navbar';
import Landing from './components/layout/Landing';
import './App.css';

const App = () => 
  // Fragments let you group a list of children without adding extra nodes to the DOM
  <Fragment>
    <Navbar />
    <Landing />
  </Fragment>

export default App;