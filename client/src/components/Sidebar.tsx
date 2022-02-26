import {Button, Container, Dropdown, Form} from "react-bootstrap";
import LocationSelectForm from "./LocationSelectForm";
import {forwardRef} from "react";

const Sidebar = (props: any, ref: any) => {
  const {formData, setFormData} = props;
  return (
    <Container>
      <LocationSelectForm
        formData={formData}
        setFormData={setFormData}
        ref={ref}
      />
    </Container>
)
}


export default forwardRef(Sidebar);
