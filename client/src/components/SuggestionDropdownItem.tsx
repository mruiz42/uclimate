import {Dropdown} from "react-bootstrap";
import {useState} from "react";


const SuggestionDropdownMenu = (props: any) => {
  const {name, id } = props;
  return (
  <Dropdown.Item eventKey={id}>{name}</Dropdown.Item>
  )
}

export default SuggestionDropdownMenu;
