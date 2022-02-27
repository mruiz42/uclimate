import Dropdown from 'react-bootstrap/Dropdown'

const SuggestionDropdownItem = (props: any) => {
  const {name, id, handleDropdownClick} = props;

  return (
      <Dropdown.Item eventKey={id}
                     as={"div"}
                     onClick={(e)=> {
                       handleDropdownClick(e, id);
                     }}>
          {name}
      </Dropdown.Item>
  );
}

export default SuggestionDropdownItem;
