import {useState} from "react";
import Dropdown from 'react-bootstrap/Dropdown'
import SuggestionDropdownItem from "./SuggestionDropdownItem";


const SuggestionDropdownMenu = (props: { queryPredictions: Array<any>, showDropdown: boolean, handleDropdownClick: any }) => {
  const {queryPredictions, showDropdown, handleDropdownClick} = props;

  return(
    <Dropdown.Menu show={showDropdown}
                   onSelect={((eventKey: any) => { //, event: any) => {
                     // event.preventDefault();
                     console.log(eventKey);
                   })}
                   rootCloseEvent={"click"}

    >
      <Dropdown.Header>Suggested Locations</Dropdown.Header>
        { queryPredictions &&
          queryPredictions.map((item, index) => {
            return (
              <SuggestionDropdownItem name={item.description}
                                      key={index}
                                      id={index}
                                      handleDropdownClick={handleDropdownClick}
            />)
          })
        }
    </Dropdown.Menu>
  )
}

export default SuggestionDropdownMenu;
