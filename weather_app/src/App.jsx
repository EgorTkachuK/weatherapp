
import './App.css';

import Header from './components/Header';
import HeroSearch from './components/HeroSearch';
import PetNews from './components/PetNews';
import NatureScroller from './components/NatureScroller';
import Footer from './components/Footer';
function App() {
  return (
    <div className="App">
      <Header />
      <HeroSearch />
      <PetNews />
      <NatureScroller />
      <Footer id="footer"/>
    </div>
  );
}

export default App;
