export default function CrumbleDivider({ position = 'bottom', fill = '#0a0d12', bg = '#060709' }) {
  const isTop = position === 'top';

  return (
    <div
      className={`crumble-divider ${isTop ? 'crumble-top' : 'crumble-bottom'}`}
      style={{
        backgroundColor: bg,
        position: 'relative',
        zIndex: 5,
      }}
    >
      <svg
        viewBox="0 0 1920 42"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path
          d="M0 0H740L790 32H1130L1180 0H1920V42H0V0Z"
          fill={fill}
        />
        <path
          d="M0 0H740L790 32H1130L1180 0H1920"
          stroke="rgba(0, 240, 255, 0.3)"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>
    </div>
  );
}
