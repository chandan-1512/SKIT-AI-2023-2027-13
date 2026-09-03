/**
 * Card — glassmorphic content container.
 *
 * @param {React.ReactNode} children
 * @param {string}  className   - additional Tailwind classes
 * @param {boolean} hoverable   - adds lift + glow on hover
 * @param {string}  id          - optional DOM id
 */
export default function Card({ children, className = '', hoverable = false, id }) {
  return (
    <div
      id={id}
      className={[
        'glass rounded-xl p-6',
        hoverable &&
          'transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-sm cursor-pointer',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
