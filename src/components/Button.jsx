import styles from "./Button.module.css";

/**
 * A configurable button with customizable label, click handler, and variants.
 * @param {Object} props
 * @param {string} props.label - The text to display on the button
 * @param {function} props.onClick - The function to call when the button is clicked
 * @param {'primary' | 'secondary' | 'tertiary'} props.variant - The style of the button (default is 'primary')

 */

export default function Button({
  label,
  onClick = (_e) => {},
  variant = "primary",
}) {
  const className = styles[variant];
  return (
    <button className={className} label={label} onClick={onClick}>
      {label}
    </button>
  );
}
