import './App.css';
import ChatPage from './Pages/ChatPage/ChatPage';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from './Pages/login/Login';
import SignUp from './Pages/SignUp/SignUp';
import { UserContextProvider } from './UserContextProvider';

function App() {
  return (
    <UserContextProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/signup" element={<SignUp/>}/>
        <Route path='/chat' element={<ChatPage/>}>
        </Route>
      </Routes>
    </BrowserRouter>
    </UserContextProvider>

  );
}

export default App;
