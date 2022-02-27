import {useState} from "react";
import {Dropdown} from "react-bootstrap";
import SuggestionDropdownItem from "./SuggestionDropdownItem";

const SuggestionDropdownMenu = (props: { queryPredictions: Array<any>, showDropdown: boolean }) => {
  const {queryPredictions, showDropdown} = props;

  return(
    <Dropdown.Menu show={showDropdown}>
      <Dropdown.Header>Suggested Locations</Dropdown.Header>
      {
        queryPredictions.map((item, index, arr) => {
          return(<SuggestionDropdownItem name={item.description} id={index} />)
        })
      }
    </Dropdown.Menu>
  )
}

export default SuggestionDropdownMenu;
