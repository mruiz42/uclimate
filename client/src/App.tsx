import React from 'react';
import {Button, Container, Dropdown, Form} from "react-bootstrap";

import styles from "./App.module.scss";
import commonStyles from "./style/Common.module.scss";
import Sidebar from "./components/Sidebar";


function App() {
  return (
    <Container fluid className={"App"}>
      <Sidebar />
    </Container>
  );
}


export default App;
