export default function Button({ children, onClick, disabled, loading }: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const handleClick = () => {
    if (!disabled && !loading) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      style={{
        padding: '0.5rem 1rem',
        backgroundColor: disabled ? '#ccc' : '#0070f3',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : loading ? 'wait' : 'pointer',
      }}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}