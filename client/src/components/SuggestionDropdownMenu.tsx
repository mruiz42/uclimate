import {useState} from "react";
import {Dropdown} from "react-bootstrap";
import SuggestionDropdownItem from "./SuggestionDropdownItem";

const SuggestionDropdownMenu = (props: any) => {
  const {data} = props;
  const [isVisible, setIsVisible] = useState(false);

  return(
    <Dropdown.Menu show={isVisible}>
      <Dropdown.Header>Suggested Locations</Dropdown.Header>
      {/*TODO: use .map() here*/}
      <SuggestionDropdownItem name={"test"} id={1} />
    </Dropdown.Menu>
  )
}

export default SuggestionDropdownMenu;
