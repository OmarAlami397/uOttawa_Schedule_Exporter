import logo from "../../extension/icons/icon128.png";

export default function BrandHeading({ as: Heading = "h1", children, ...props }) {
  return (
    <Heading {...props}>
      <img className="popup-brand-logo" src={logo} alt="" width="40" height="40" />
      <span>{children}</span>
    </Heading>
  );
}
