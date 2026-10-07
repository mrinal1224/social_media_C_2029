import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import './index.css'
import App from './App.jsx'
import { store } from './redux/store.js'

// REDUX STEP 4: CONNECT REACT TO THE REDUX STORE
//
// Provider makes the Redux store available to every component below it.
//
// WHY:
// Home and Profile live on different routes and are not parent/child components.
// Passing post state through props would become awkward.
// Provider lets both pages access the same store using useSelector/useDispatch.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
