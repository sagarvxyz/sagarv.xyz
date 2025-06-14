import Button from "./Button";

/**
 * NavButton component renders a button wrapped in an anchor tag.
 *
 * @param {Object} props - The props object.
 * @param {string} props.label - The label for the button.
 * @param {function} [props.onClick] - The click event handler for the button. Defaults to an empty function.
 * @param {string} [props.variant] - The variant of the button. Defaults to "secondary".
 * @param {string} props.href - The URL that the anchor tag points to.
 * @param {Object} [props] - Additional props to be spread onto the anchor tag.
 * @returns {JSX.Element} The rendered NavButton component.
 */
export default function NavButton({
  label,
  onClick = (_e) => {},
  variant = "secondary",
  href,
  ...props
}) {
  return (
    <a href={href} {...props}>
      <Button label={label} onClick={onClick} variant={variant} />
    </a>
  );
}
